from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.stage import StageType, ResourceType


class MonthlyFTECreate(BaseModel):
    year_month: str  # YYYY-MM
    fte_value: Decimal  # 0.00 - 1.00


class MonthlyFTEResponse(MonthlyFTECreate):
    id: int

    class Config:
        from_attributes = True


class StageAllocationBase(BaseModel):
    role_id: int
    rate_category_id: Optional[int] = None
    resource_type: ResourceType
    employee_name: Optional[str] = None
    monthly_salary: Optional[Decimal] = None
    bonus_percent: Optional[Decimal] = 0
    fixed_monthly_cost: Optional[Decimal] = None
    notes: Optional[str] = None


class StageAllocationCreate(StageAllocationBase):
    monthly_fte: List[MonthlyFTECreate] = []


class StageAllocationUpdate(BaseModel):
    role_id: Optional[int] = None
    rate_category_id: Optional[int] = None
    resource_type: Optional[ResourceType] = None
    employee_name: Optional[str] = None
    monthly_salary: Optional[Decimal] = None
    bonus_percent: Optional[Decimal] = None
    fixed_monthly_cost: Optional[Decimal] = None
    notes: Optional[str] = None
    monthly_fte: Optional[List[MonthlyFTECreate]] = None


class StageAllocationResponse(StageAllocationBase):
    id: int
    stage_id: int
    monthly_fte: List[MonthlyFTEResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class StageBase(BaseModel):
    stage_type: StageType
    name: Optional[str] = None
    order_index: int
    start_month: str  # YYYY-MM
    end_month: str  # YYYY-MM


class StageCreate(StageBase):
    allocations: List[StageAllocationCreate] = []


class StageUpdate(BaseModel):
    stage_type: Optional[StageType] = None
    name: Optional[str] = None
    order_index: Optional[int] = None
    start_month: Optional[str] = None
    end_month: Optional[str] = None


class StageResponse(StageBase):
    id: int
    version_id: int
    allocations: List[StageAllocationResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
