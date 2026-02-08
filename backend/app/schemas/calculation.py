from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class CalculationBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date


class CalculationCreate(CalculationBase):
    pass


class CalculationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CalculationResponse(CalculationBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CalculationVersionCreate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    is_baseline: bool = False


class CalculationVersionUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    is_baseline: Optional[bool] = None


class CalculationVersionResponse(BaseModel):
    id: int
    calculation_id: int
    version_number: int
    name: Optional[str] = None
    notes: Optional[str] = None
    is_baseline: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CalculationDetailResponse(CalculationResponse):
    versions: List[CalculationVersionResponse] = []
