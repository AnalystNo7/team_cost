"""
Cost Calculator Service
Calculates project team cost based on Russian tax legislation
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from sqlalchemy.orm import Session

from app.models import ProjectVersion, Stage, StageAllocation, MonthlyFTE, RateCategory, Role
from app.schemas.cost import (
    CostCalculationResult, StageCostResult, AllocationCostResult, MonthlyDetail
)
from app.services.calendar_service import CalendarService
from app.config import settings


class CostCalculatorService:
    # Insurance contribution rates (2024)
    PENSION_RATE = Decimal("0.22")  # До предельной базы
    PENSION_RATE_ABOVE = Decimal("0.10")  # Сверх предельной базы
    SOCIAL_RATE = Decimal("0.029")  # ФСС (до предельной базы)
    MEDICAL_RATE = Decimal("0.051")  # ФОМС (без ограничений)

    # Unified social tax limit for 2024
    UST_LIMIT = Decimal("2225000")

    @staticmethod
    def calculate_insurance_contributions(
        annual_gross: Decimal,
        accumulated_gross: Decimal = Decimal("0")
    ) -> Decimal:
        """
        Calculate insurance contributions for a given gross amount
        Takes into account the unified social tax limit
        """
        # Calculate how much of annual_gross is below the limit
        remaining_limit = max(Decimal("0"), CostCalculatorService.UST_LIMIT - accumulated_gross)

        if remaining_limit >= annual_gross:
            # All within limit
            pension = annual_gross * CostCalculatorService.PENSION_RATE
            social = annual_gross * CostCalculatorService.SOCIAL_RATE
        elif remaining_limit > 0:
            # Partially within limit
            below_limit = remaining_limit
            above_limit = annual_gross - remaining_limit
            pension = (below_limit * CostCalculatorService.PENSION_RATE +
                      above_limit * CostCalculatorService.PENSION_RATE_ABOVE)
            social = below_limit * CostCalculatorService.SOCIAL_RATE
        else:
            # All above limit
            pension = annual_gross * CostCalculatorService.PENSION_RATE_ABOVE
            social = Decimal("0")

        medical = annual_gross * CostCalculatorService.MEDICAL_RATE

        return (pension + social + medical).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def calculate_monthly_cost(
        monthly_salary: Decimal,
        bonus_percent: Decimal,
        fte: Decimal,
        working_hours: int
    ) -> Decimal:
        """
        Calculate monthly cost for internal resource
        Cost = (Salary + Monthly Bonus Portion) * (1 + Insurance Rate) * FTE
        """
        if monthly_salary is None or monthly_salary == 0:
            return Decimal("0")

        # Calculate monthly bonus portion
        annual_salary = monthly_salary * 12
        annual_bonus = annual_salary * (bonus_percent / 100)
        monthly_bonus = annual_bonus / 12

        # Gross monthly with bonus
        gross_monthly = monthly_salary + monthly_bonus

        # Calculate insurance (simplified - using average rate)
        # For MVP, using flat rate approach
        insurance_rate = (CostCalculatorService.PENSION_RATE +
                         CostCalculatorService.SOCIAL_RATE +
                         CostCalculatorService.MEDICAL_RATE)

        cost_with_insurance = gross_monthly * (1 + insurance_rate)

        # Apply FTE
        final_cost = cost_with_insurance * fte

        return final_cost.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def calculate_monthly_revenue(
        hourly_rate: Decimal,
        fte: Decimal,
        working_hours: int
    ) -> Decimal:
        """
        Calculate monthly revenue based on external rate
        Revenue = Hourly Rate * Working Hours * FTE
        """
        if hourly_rate is None or hourly_rate == 0:
            return Decimal("0")

        revenue = hourly_rate * working_hours * fte
        return revenue.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def calculate_external_cost(
        hourly_rate: Optional[Decimal],
        fixed_cost: Optional[Decimal],
        fte: Decimal,
        working_hours: int
    ) -> Decimal:
        """
        Calculate cost for external resource (contractor)
        Either fixed monthly cost or hourly rate * hours
        """
        if fixed_cost and fixed_cost > 0:
            return (fixed_cost * fte).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if hourly_rate and hourly_rate > 0:
            return (hourly_rate * working_hours * fte).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return Decimal("0")

    @classmethod
    def calculate_version(cls, db: Session, version_id: int) -> CostCalculationResult:
        """Calculate full cost for a project version"""
        version = db.query(ProjectVersion).filter(
            ProjectVersion.id == version_id
        ).first()

        if not version:
            raise ValueError(f"Version {version_id} not found")

        project = version.project

        total_cost = Decimal("0")
        total_revenue = Decimal("0")
        total_internal_cost = Decimal("0")
        total_external_cost = Decimal("0")
        cost_by_role: dict = {}
        cost_by_month: dict = {}
        revenue_by_month: dict = {}

        stage_results = []

        for stage in sorted(version.stages, key=lambda s: s.order_index):
            stage_result = cls._calculate_stage(db, stage)
            stage_results.append(stage_result)

            total_cost += stage_result.total_cost
            total_revenue += stage_result.total_revenue
            total_internal_cost += stage_result.internal_cost
            total_external_cost += stage_result.external_cost

            # Aggregate by role
            for alloc in stage_result.allocations:
                role_name = alloc.role_name
                cost_by_role[role_name] = cost_by_role.get(role_name, Decimal("0")) + alloc.total_cost

                # Aggregate by month
                for detail in alloc.monthly_details:
                    cost_by_month[detail.year_month] = (
                        cost_by_month.get(detail.year_month, Decimal("0")) + detail.cost
                    )
                    revenue_by_month[detail.year_month] = (
                        revenue_by_month.get(detail.year_month, Decimal("0")) + detail.revenue
                    )

        total_margin = total_revenue - total_cost
        margin_percent = None
        if total_revenue > 0:
            margin_percent = ((total_margin / total_revenue) * 100).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

        return CostCalculationResult(
            project_id=project.id,
            version_id=version.id,
            project_name=project.name,
            methodology=project.methodology.value,
            start_date=project.start_date,
            end_date=project.end_date,
            total_cost=total_cost,
            total_revenue=total_revenue,
            total_margin=total_margin,
            margin_percent=margin_percent,
            total_internal_cost=total_internal_cost,
            total_external_cost=total_external_cost,
            stages=stage_results,
            cost_by_role=cost_by_role,
            cost_by_month=cost_by_month,
            revenue_by_month=revenue_by_month,
        )

    @classmethod
    def _calculate_stage(cls, db: Session, stage: Stage) -> StageCostResult:
        """Calculate cost for a single stage"""
        total_cost = Decimal("0")
        total_revenue = Decimal("0")
        internal_cost = Decimal("0")
        external_cost = Decimal("0")

        allocation_results = []

        for allocation in stage.allocations:
            alloc_result = cls._calculate_allocation(db, allocation)
            allocation_results.append(alloc_result)

            total_cost += alloc_result.total_cost
            total_revenue += alloc_result.total_revenue

            if allocation.resource_type.value == "internal":
                internal_cost += alloc_result.total_cost
            else:
                external_cost += alloc_result.total_cost

        total_margin = total_revenue - total_cost
        margin_percent = None
        if total_revenue > 0:
            margin_percent = ((total_margin / total_revenue) * 100).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

        # Get stage display name
        stage_names = {
            "initiation": "Инициирование",
            "elaboration": "Проработка",
            "design": "Проектирование",
            "development": "Разработка и внедрение",
            "pilot": "Опытная эксплуатация",
            "expansion": "Развитие и тиражирование",
            "closure": "Завершение",
            "mvp_creation": "Создание MVP",
            "mvp_pilot": "Опытная эксплуатация и доработка MVP",
        }
        stage_name = stage.name or stage_names.get(stage.stage_type.value, stage.stage_type.value)

        return StageCostResult(
            stage_id=stage.id,
            stage_type=stage.stage_type.value,
            stage_name=stage_name,
            start_date=str(stage.start_date),
            end_date=str(stage.end_date),
            total_cost=total_cost,
            total_revenue=total_revenue,
            total_margin=total_margin,
            margin_percent=margin_percent,
            internal_cost=internal_cost,
            external_cost=external_cost,
            allocations=allocation_results,
        )

    @classmethod
    def _calculate_allocation(cls, db: Session, allocation: StageAllocation) -> AllocationCostResult:
        """Calculate cost for a single allocation"""
        total_cost = Decimal("0")
        total_revenue = Decimal("0")
        monthly_details = []

        role = db.query(Role).filter(Role.id == allocation.role_id).first()
        role_name = role.name if role else "Unknown"

        rate_category = None
        hourly_rate = Decimal("0")
        if allocation.rate_category_id:
            rc = db.query(RateCategory).filter(RateCategory.id == allocation.rate_category_id).first()
            if rc:
                rate_category = rc.code
                hourly_rate = Decimal(str(rc.hourly_rate))

        for fte_record in allocation.monthly_fte:
            year, month = CalendarService.parse_year_month(fte_record.year_month)
            working_hours = CalendarService.get_working_hours(year, month)
            fte = Decimal(str(fte_record.fte_value))

            if allocation.resource_type.value == "internal":
                monthly_salary = Decimal(str(allocation.monthly_salary)) if allocation.monthly_salary else Decimal("0")
                bonus_percent = Decimal(str(allocation.bonus_percent)) if allocation.bonus_percent else Decimal("0")
                cost = cls.calculate_monthly_cost(monthly_salary, bonus_percent, fte, working_hours)
            else:
                fixed_cost = Decimal(str(allocation.fixed_monthly_cost)) if allocation.fixed_monthly_cost else None
                cost = cls.calculate_external_cost(hourly_rate, fixed_cost, fte, working_hours)

            revenue = cls.calculate_monthly_revenue(hourly_rate, fte, working_hours)
            margin = revenue - cost

            monthly_details.append(MonthlyDetail(
                year_month=fte_record.year_month,
                fte=fte,
                working_hours=working_hours,
                cost=cost,
                revenue=revenue,
                margin=margin,
            ))

            total_cost += cost
            total_revenue += revenue

        total_margin = total_revenue - total_cost
        margin_percent = None
        if total_revenue > 0:
            margin_percent = ((total_margin / total_revenue) * 100).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

        return AllocationCostResult(
            allocation_id=allocation.id,
            role_name=role_name,
            employee_name=allocation.employee_name,
            resource_type=allocation.resource_type.value,
            rate_category=rate_category,
            monthly_salary=allocation.monthly_salary,
            bonus_percent=allocation.bonus_percent,
            total_cost=total_cost,
            total_revenue=total_revenue,
            total_margin=total_margin,
            margin_percent=margin_percent,
            monthly_details=monthly_details,
        )
