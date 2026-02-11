from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectVersionCreate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    is_baseline: bool = False


class ProjectVersionUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    is_baseline: Optional[bool] = None


class ProjectVersionResponse(BaseModel):
    id: int
    project_id: int
    version_number: int
    name: Optional[str] = None
    notes: Optional[str] = None
    is_baseline: bool
    created_at: datetime

    class Config:
        from_attributes = True
