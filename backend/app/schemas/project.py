from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.models.project import MethodologyType


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    methodology: MethodologyType
    start_date: date
    end_date: date


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    methodology: Optional[MethodologyType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CalculationBriefResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectDetailResponse(ProjectResponse):
    calculations: List[CalculationBriefResponse] = []
