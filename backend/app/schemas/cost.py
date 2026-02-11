from pydantic import BaseModel
from typing import List, Dict, Optional
from decimal import Decimal


class MonthlyDetail(BaseModel):
    year_month: str
    fte: Decimal
    working_hours: int
    cost: Decimal
    revenue: Decimal
    margin: Decimal


class AllocationCostResult(BaseModel):
    allocation_id: int
    role_name: str
    employee_name: Optional[str]
    resource_type: str
    rate_category: Optional[str]
    monthly_salary: Optional[Decimal]
    bonus_percent: Optional[Decimal]
    total_cost: Decimal
    total_revenue: Decimal
    total_margin: Decimal
    margin_percent: Optional[Decimal]
    monthly_details: List[MonthlyDetail]


class StageCostResult(BaseModel):
    stage_id: int
    stage_type: str
    stage_name: str
    start_date: str
    end_date: str
    total_cost: Decimal
    total_revenue: Decimal
    total_margin: Decimal
    margin_percent: Optional[Decimal]
    internal_cost: Decimal
    external_cost: Decimal
    allocations: List[AllocationCostResult]


class CostCalculationResult(BaseModel):
    project_id: int
    version_id: int
    project_name: str
    methodology: str
    start_date: str
    end_date: str
    total_cost: Decimal
    total_revenue: Decimal
    total_margin: Decimal
    margin_percent: Optional[Decimal]
    total_internal_cost: Decimal
    total_external_cost: Decimal
    stages: List[StageCostResult]
    cost_by_role: Dict[str, Decimal]
    cost_by_month: Dict[str, Decimal]
    revenue_by_month: Dict[str, Decimal]
