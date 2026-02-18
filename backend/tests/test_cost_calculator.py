"""
Tests for CostCalculatorService
Verifies cost calculation logic with concrete numerical examples.

Tax rates used (2024):
  - Pension fund (ПФР): 22% (below limit), 10% (above limit)
  - Social insurance (ФСС): 2.9% (below limit), 0% (above limit)
  - Medical insurance (ФОМС): 5.1% (no limit)
  - Unified social tax limit: 2,225,000 RUB/year
"""
import pytest
from decimal import Decimal, ROUND_HALF_UP
from app.services.cost_calculator import CostCalculatorService


class TestInsuranceContributions:
    """Test insurance contribution calculations against the unified social tax limit."""

    def test_fully_below_limit(self):
        """
        Annual gross: 1,000,000 RUB (below UST limit of 2,225,000)
        Expected:
          Pension: 1,000,000 * 0.22 = 220,000.00
          Social:  1,000,000 * 0.029 = 29,000.00
          Medical: 1,000,000 * 0.051 = 51,000.00
          Total: 300,000.00
        """
        result = CostCalculatorService.calculate_insurance_contributions(
            Decimal("1000000"), Decimal("0")
        )
        assert result == Decimal("300000.00")

    def test_fully_above_limit(self):
        """
        Annual gross: 500,000, accumulated: 2,500,000 (already above limit)
        Expected:
          Pension: 500,000 * 0.10 = 50,000.00
          Social:  0 (above limit)
          Medical: 500,000 * 0.051 = 25,500.00
          Total: 75,500.00
        """
        result = CostCalculatorService.calculate_insurance_contributions(
            Decimal("500000"), Decimal("2500000")
        )
        assert result == Decimal("75500.00")

    def test_partially_crosses_limit(self):
        """
        Annual gross: 1,000,000, accumulated: 2,000,000
        Remaining limit: 2,225,000 - 2,000,000 = 225,000
        Below limit: 225,000, Above limit: 775,000

        Expected:
          Pension: 225,000 * 0.22 + 775,000 * 0.10 = 49,500 + 77,500 = 127,000.00
          Social:  225,000 * 0.029 = 6,525.00
          Medical: 1,000,000 * 0.051 = 51,000.00
          Total: 184,525.00
        """
        result = CostCalculatorService.calculate_insurance_contributions(
            Decimal("1000000"), Decimal("2000000")
        )
        assert result == Decimal("184525.00")

    def test_zero_gross(self):
        result = CostCalculatorService.calculate_insurance_contributions(
            Decimal("0"), Decimal("0")
        )
        assert result == Decimal("0.00")

    def test_exactly_at_limit(self):
        """
        Annual gross: 2,225,000 (exactly at limit), accumulated: 0
        All within limit:
          Pension: 2,225,000 * 0.22 = 489,500.00
          Social:  2,225,000 * 0.029 = 64,525.00
          Medical: 2,225,000 * 0.051 = 113,475.00
          Total: 667,500.00
        """
        result = CostCalculatorService.calculate_insurance_contributions(
            Decimal("2225000"), Decimal("0")
        )
        assert result == Decimal("667500.00")


class TestMonthlyInternalCost:
    """
    Test monthly cost for internal resources.
    Formula: (Salary + MonthlyBonus) * (1 + InsuranceRate) * FTE

    Where InsuranceRate = 0.22 + 0.029 + 0.051 = 0.30
    (simplified flat rate, not accounting for UST limit)
    """

    def test_basic_salary_no_bonus(self):
        """
        Salary: 200,000 RUB/month, Bonus: 0%, FTE: 1.0, Hours: 176

        MonthlyBonus = 200,000 * 12 * 0/100 / 12 = 0
        GrossMonthly = 200,000 + 0 = 200,000
        InsuranceRate = 0.22 + 0.029 + 0.051 = 0.30
        CostWithInsurance = 200,000 * 1.30 = 260,000.00
        FinalCost = 260,000.00 * 1.0 = 260,000.00
        """
        result = CostCalculatorService.calculate_monthly_cost(
            monthly_salary=Decimal("200000"),
            bonus_percent=Decimal("0"),
            fte=Decimal("1.0"),
            working_hours=176
        )
        assert result == Decimal("260000.00")

    def test_salary_with_bonus(self):
        """
        Salary: 200,000 RUB/month, Bonus: 20%, FTE: 1.0, Hours: 176

        AnnualSalary = 200,000 * 12 = 2,400,000
        AnnualBonus = 2,400,000 * 20/100 = 480,000
        MonthlyBonus = 480,000 / 12 = 40,000
        GrossMonthly = 200,000 + 40,000 = 240,000
        CostWithInsurance = 240,000 * 1.30 = 312,000.00
        FinalCost = 312,000.00 * 1.0 = 312,000.00
        """
        result = CostCalculatorService.calculate_monthly_cost(
            monthly_salary=Decimal("200000"),
            bonus_percent=Decimal("20"),
            fte=Decimal("1.0"),
            working_hours=176
        )
        assert result == Decimal("312000.00")

    def test_partial_fte(self):
        """
        Salary: 200,000, Bonus: 0%, FTE: 0.5, Hours: 176

        GrossMonthly = 200,000
        CostWithInsurance = 200,000 * 1.30 = 260,000
        FinalCost = 260,000 * 0.5 = 130,000.00
        """
        result = CostCalculatorService.calculate_monthly_cost(
            monthly_salary=Decimal("200000"),
            bonus_percent=Decimal("0"),
            fte=Decimal("0.5"),
            working_hours=176
        )
        assert result == Decimal("130000.00")

    def test_salary_with_bonus_and_partial_fte(self):
        """
        Salary: 150,000, Bonus: 15%, FTE: 0.75, Hours: 168

        AnnualSalary = 150,000 * 12 = 1,800,000
        AnnualBonus = 1,800,000 * 15/100 = 270,000
        MonthlyBonus = 270,000 / 12 = 22,500
        GrossMonthly = 150,000 + 22,500 = 172,500
        CostWithInsurance = 172,500 * 1.30 = 224,250
        FinalCost = 224,250 * 0.75 = 168,187.50
        """
        result = CostCalculatorService.calculate_monthly_cost(
            monthly_salary=Decimal("150000"),
            bonus_percent=Decimal("15"),
            fte=Decimal("0.75"),
            working_hours=168
        )
        assert result == Decimal("168187.50")

    def test_zero_salary(self):
        result = CostCalculatorService.calculate_monthly_cost(
            monthly_salary=Decimal("0"),
            bonus_percent=Decimal("10"),
            fte=Decimal("1.0"),
            working_hours=176
        )
        assert result == Decimal("0")

    def test_none_salary(self):
        result = CostCalculatorService.calculate_monthly_cost(
            monthly_salary=None,
            bonus_percent=Decimal("10"),
            fte=Decimal("1.0"),
            working_hours=176
        )
        assert result == Decimal("0")


class TestMonthlyRevenue:
    """
    Test monthly revenue from external rate.
    Formula: HourlyRate * WorkingHours * FTE
    """

    def test_basic_revenue(self):
        """
        HourlyRate: 3,000 RUB, FTE: 1.0, WorkingHours: 176
        Revenue = 3,000 * 176 * 1.0 = 528,000.00
        """
        result = CostCalculatorService.calculate_monthly_revenue(
            hourly_rate=Decimal("3000"),
            fte=Decimal("1.0"),
            working_hours=176
        )
        assert result == Decimal("528000.00")

    def test_partial_fte_revenue(self):
        """
        HourlyRate: 3,000, FTE: 0.5, WorkingHours: 176
        Revenue = 3,000 * 176 * 0.5 = 264,000.00
        """
        result = CostCalculatorService.calculate_monthly_revenue(
            hourly_rate=Decimal("3000"),
            fte=Decimal("0.5"),
            working_hours=176
        )
        assert result == Decimal("264000.00")

    def test_different_hours(self):
        """
        HourlyRate: 2,500, FTE: 1.0, WorkingHours: 136 (Jan 2025: 17 days)
        Revenue = 2,500 * 136 * 1.0 = 340,000.00
        """
        result = CostCalculatorService.calculate_monthly_revenue(
            hourly_rate=Decimal("2500"),
            fte=Decimal("1.0"),
            working_hours=136
        )
        assert result == Decimal("340000.00")

    def test_zero_rate(self):
        result = CostCalculatorService.calculate_monthly_revenue(
            hourly_rate=Decimal("0"),
            fte=Decimal("1.0"),
            working_hours=176
        )
        assert result == Decimal("0")

    def test_none_rate(self):
        result = CostCalculatorService.calculate_monthly_revenue(
            hourly_rate=None,
            fte=Decimal("1.0"),
            working_hours=176
        )
        assert result == Decimal("0")


class TestExternalCost:
    """
    Test external resource (contractor) cost calculation.
    Either fixed monthly cost or hourly rate * hours.
    """

    def test_fixed_cost(self):
        """
        Fixed cost: 500,000, FTE: 1.0
        Cost = 500,000 * 1.0 = 500,000.00
        """
        result = CostCalculatorService.calculate_external_cost(
            hourly_rate=Decimal("3000"),
            fixed_cost=Decimal("500000"),
            fte=Decimal("1.0"),
            working_hours=176
        )
        # Fixed cost takes priority over hourly rate
        assert result == Decimal("500000.00")

    def test_fixed_cost_partial_fte(self):
        """
        Fixed cost: 500,000, FTE: 0.5
        Cost = 500,000 * 0.5 = 250,000.00
        """
        result = CostCalculatorService.calculate_external_cost(
            hourly_rate=None,
            fixed_cost=Decimal("500000"),
            fte=Decimal("0.5"),
            working_hours=176
        )
        assert result == Decimal("250000.00")

    def test_hourly_rate(self):
        """
        Hourly rate: 3,000, FTE: 1.0, Hours: 176
        Cost = 3,000 * 176 * 1.0 = 528,000.00
        """
        result = CostCalculatorService.calculate_external_cost(
            hourly_rate=Decimal("3000"),
            fixed_cost=None,
            fte=Decimal("1.0"),
            working_hours=176
        )
        assert result == Decimal("528000.00")

    def test_hourly_rate_partial_fte(self):
        """
        Hourly rate: 2,000, FTE: 0.75, Hours: 184
        Cost = 2,000 * 184 * 0.75 = 276,000.00
        """
        result = CostCalculatorService.calculate_external_cost(
            hourly_rate=Decimal("2000"),
            fixed_cost=None,
            fte=Decimal("0.75"),
            working_hours=184
        )
        assert result == Decimal("276000.00")

    def test_no_rate_no_fixed(self):
        result = CostCalculatorService.calculate_external_cost(
            hourly_rate=None,
            fixed_cost=None,
            fte=Decimal("1.0"),
            working_hours=176
        )
        assert result == Decimal("0")

    def test_fixed_cost_prioritized_over_hourly(self):
        """When both fixed_cost and hourly_rate are provided, fixed_cost wins."""
        result = CostCalculatorService.calculate_external_cost(
            hourly_rate=Decimal("3000"),
            fixed_cost=Decimal("400000"),
            fte=Decimal("1.0"),
            working_hours=176
        )
        assert result == Decimal("400000.00")


class TestEndToEndCalculationScenario:
    """
    End-to-end scenario with manual verification.

    Scenario: 2-month project (Jan-Feb 2025) with 1 internal dev and 1 external consultant.

    Internal developer:
      - Salary: 200,000/month, Bonus: 20%
      - FTE: 1.0 both months
      - Rate category: Senior Dev, 3,000 RUB/hour

    External consultant:
      - Fixed cost: 300,000/month
      - FTE: 0.5 both months
      - Rate category: Consultant, 2,500 RUB/hour

    Working days: Jan 2025 = 17 days (136h), Feb 2025 = 19 days (152h)
    """

    def test_internal_dev_jan(self):
        """
        Jan 2025: 17 days, 136 hours
        Salary: 200,000, Bonus: 20%

        AnnualSalary = 200,000 * 12 = 2,400,000
        AnnualBonus = 2,400,000 * 0.20 = 480,000
        MonthlyBonus = 40,000
        Gross = 240,000
        Insurance = 240,000 * 0.30 = 72,000
        Cost = 240,000 + 72,000 = 312,000
        FTE = 1.0 → Cost = 312,000.00

        Revenue = 3,000 * 136 * 1.0 = 408,000.00
        Margin = 408,000 - 312,000 = 96,000.00
        """
        cost = CostCalculatorService.calculate_monthly_cost(
            Decimal("200000"), Decimal("20"), Decimal("1.0"), 136
        )
        revenue = CostCalculatorService.calculate_monthly_revenue(
            Decimal("3000"), Decimal("1.0"), 136
        )
        assert cost == Decimal("312000.00")
        assert revenue == Decimal("408000.00")
        assert revenue - cost == Decimal("96000.00")

    def test_internal_dev_feb(self):
        """
        Feb 2025: 19 days, 152 hours
        Same salary parameters, different hours for revenue.

        Cost = 312,000.00 (salary-based, doesn't change with hours)
        Revenue = 3,000 * 152 * 1.0 = 456,000.00
        Margin = 456,000 - 312,000 = 144,000.00
        """
        cost = CostCalculatorService.calculate_monthly_cost(
            Decimal("200000"), Decimal("20"), Decimal("1.0"), 152
        )
        revenue = CostCalculatorService.calculate_monthly_revenue(
            Decimal("3000"), Decimal("1.0"), 152
        )
        assert cost == Decimal("312000.00")
        assert revenue == Decimal("456000.00")
        assert revenue - cost == Decimal("144000.00")

    def test_external_consultant_jan(self):
        """
        Jan 2025: 136 hours, FTE 0.5
        Fixed cost: 300,000/month

        Cost = 300,000 * 0.5 = 150,000.00
        Revenue = 2,500 * 136 * 0.5 = 170,000.00
        Margin = 170,000 - 150,000 = 20,000.00
        """
        cost = CostCalculatorService.calculate_external_cost(
            Decimal("2500"), Decimal("300000"), Decimal("0.5"), 136
        )
        revenue = CostCalculatorService.calculate_monthly_revenue(
            Decimal("2500"), Decimal("0.5"), 136
        )
        assert cost == Decimal("150000.00")
        assert revenue == Decimal("170000.00")
        assert revenue - cost == Decimal("20000.00")

    def test_external_consultant_feb(self):
        """
        Feb 2025: 152 hours, FTE 0.5
        Fixed cost: 300,000/month

        Cost = 300,000 * 0.5 = 150,000.00
        Revenue = 2,500 * 152 * 0.5 = 190,000.00
        Margin = 190,000 - 150,000 = 40,000.00
        """
        cost = CostCalculatorService.calculate_external_cost(
            Decimal("2500"), Decimal("300000"), Decimal("0.5"), 152
        )
        revenue = CostCalculatorService.calculate_monthly_revenue(
            Decimal("2500"), Decimal("0.5"), 152
        )
        assert cost == Decimal("150000.00")
        assert revenue == Decimal("190000.00")
        assert revenue - cost == Decimal("40000.00")

    def test_project_totals(self):
        """
        Total project costs/revenues across 2 months, 2 resources:

        Internal dev:  Cost = 312,000*2 = 624,000. Revenue = 408,000+456,000 = 864,000
        External cons: Cost = 150,000*2 = 300,000. Revenue = 170,000+190,000 = 360,000

        Total cost:    624,000 + 300,000 = 924,000
        Total revenue: 864,000 + 360,000 = 1,224,000
        Total margin:  1,224,000 - 924,000 = 300,000
        Margin %:      300,000 / 1,224,000 * 100 = 24.51%
        """
        total_cost = Decimal("624000") + Decimal("300000")
        total_revenue = Decimal("864000") + Decimal("360000")
        total_margin = total_revenue - total_cost
        margin_pct = (total_margin / total_revenue * 100).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        assert total_cost == Decimal("924000")
        assert total_revenue == Decimal("1224000")
        assert total_margin == Decimal("300000")
        assert margin_pct == Decimal("24.51")


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_very_small_fte(self):
        """FTE = 0.01 (1% involvement)"""
        result = CostCalculatorService.calculate_monthly_cost(
            Decimal("200000"), Decimal("0"), Decimal("0.01"), 176
        )
        # 200,000 * 1.30 * 0.01 = 2,600.00
        assert result == Decimal("2600.00")

    def test_high_bonus(self):
        """Bonus at 100% of annual salary."""
        result = CostCalculatorService.calculate_monthly_cost(
            Decimal("100000"), Decimal("100"), Decimal("1.0"), 176
        )
        # AnnualSalary = 1,200,000, AnnualBonus = 1,200,000, MonthlyBonus = 100,000
        # Gross = 200,000, Cost = 200,000 * 1.30 = 260,000
        assert result == Decimal("260000.00")

    def test_high_hourly_rate(self):
        """Very high hourly rate for rare specialists."""
        result = CostCalculatorService.calculate_monthly_revenue(
            Decimal("10000"), Decimal("1.0"), 176
        )
        # 10,000 * 176 = 1,760,000
        assert result == Decimal("1760000.00")

    def test_insurance_large_salary(self):
        """
        Very high salary (above UST limit in a single year).
        Annual gross = 3,000,000 (above 2,225,000 limit)
        Below limit: 2,225,000, Above: 775,000

        Pension: 2,225,000 * 0.22 + 775,000 * 0.10 = 489,500 + 77,500 = 567,000
        Social: 2,225,000 * 0.029 = 64,525
        Medical: 3,000,000 * 0.051 = 153,000
        Total: 784,525.00
        """
        result = CostCalculatorService.calculate_insurance_contributions(
            Decimal("3000000"), Decimal("0")
        )
        assert result == Decimal("784525.00")
