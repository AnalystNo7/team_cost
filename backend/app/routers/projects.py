from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Project, ProjectVersion, Stage, StageAllocation, MonthlyFTE
from app.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse,
    ProjectVersionCreate, ProjectVersionUpdate, ProjectVersionResponse,
    StageCreate, StageUpdate, StageResponse,
    StageAllocationCreate, StageAllocationUpdate, StageAllocationResponse,
)
from app.schemas.cost import CostCalculationResult
from app.services.cost_calculator import CostCalculatorService

router = APIRouter(prefix="/projects", tags=["Projects"])


# ============ Projects ============

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    """Get all projects"""
    return db.query(Project).order_by(Project.updated_at.desc()).all()


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get project with versions"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create new project"""
    db_project = Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project: ProjectUpdate, db: Session = Depends(get_db)):
    """Update project"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)

    db.commit()
    db.refresh(db_project)
    return db_project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete project"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted"}


# ============ Versions ============

@router.get("/{project_id}/versions", response_model=List[ProjectVersionResponse])
def get_versions(project_id: int, db: Session = Depends(get_db)):
    """Get all versions for a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(ProjectVersion).filter(
        ProjectVersion.project_id == project_id
    ).order_by(ProjectVersion.version_number).all()


@router.post("/{project_id}/versions", response_model=ProjectVersionResponse)
def create_version(project_id: int, version: ProjectVersionCreate, db: Session = Depends(get_db)):
    """Create new version for project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get next version number (max existing + 1, or 1 if no versions)
    from sqlalchemy import func
    max_version_num = db.query(func.max(ProjectVersion.version_number)).filter(
        ProjectVersion.project_id == project_id
    ).scalar()
    next_version = (max_version_num or 0) + 1

    db_version = ProjectVersion(
        project_id=project_id,
        version_number=next_version,
        **version.model_dump()
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version


@router.get("/{project_id}/versions/{version_id}", response_model=ProjectVersionResponse)
def get_version(project_id: int, version_id: int, db: Session = Depends(get_db)):
    """Get specific version"""
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id,
        ProjectVersion.project_id == project_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


@router.put("/{project_id}/versions/{version_id}", response_model=ProjectVersionResponse)
def update_version(project_id: int, version_id: int, version_data: ProjectVersionUpdate, db: Session = Depends(get_db)):
    """Update version"""
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id,
        ProjectVersion.project_id == project_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    update_data = version_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(version, field, value)

    db.commit()
    db.refresh(version)
    return version


@router.delete("/{project_id}/versions/{version_id}")
def delete_version(project_id: int, version_id: int, db: Session = Depends(get_db)):
    """Delete version"""
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id,
        ProjectVersion.project_id == project_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    db.delete(version)
    db.commit()
    return {"message": "Version deleted"}


# ============ Stages ============

@router.get("/{project_id}/versions/{version_id}/stages", response_model=List[StageResponse])
def get_stages(project_id: int, version_id: int, db: Session = Depends(get_db)):
    """Get all stages for a version"""
    stages = db.query(Stage).filter(Stage.version_id == version_id).order_by(Stage.order_index).all()
    return stages


@router.post("/{project_id}/versions/{version_id}/stages", response_model=StageResponse)
def create_stage(project_id: int, version_id: int, stage: StageCreate, db: Session = Depends(get_db)):
    """Create new stage"""
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id,
        ProjectVersion.project_id == project_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    stage_data = stage.model_dump(exclude={'allocations'})
    db_stage = Stage(version_id=version_id, **stage_data)
    db.add(db_stage)
    db.commit()
    db.refresh(db_stage)

    # Create allocations
    for alloc in stage.allocations:
        alloc_data = alloc.model_dump(exclude={'monthly_fte'})
        db_alloc = StageAllocation(stage_id=db_stage.id, **alloc_data)
        db.add(db_alloc)
        db.commit()
        db.refresh(db_alloc)

        # Create monthly FTE
        for fte in alloc.monthly_fte:
            db_fte = MonthlyFTE(allocation_id=db_alloc.id, **fte.model_dump())
            db.add(db_fte)

    db.commit()
    db.refresh(db_stage)
    return db_stage


@router.put("/{project_id}/versions/{version_id}/stages/{stage_id}", response_model=StageResponse)
def update_stage(project_id: int, version_id: int, stage_id: int, stage: StageUpdate, db: Session = Depends(get_db)):
    """Update stage"""
    db_stage = db.query(Stage).filter(
        Stage.id == stage_id,
        Stage.version_id == version_id
    ).first()
    if not db_stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    update_data = stage.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_stage, field, value)

    db.commit()
    db.refresh(db_stage)
    return db_stage


@router.delete("/{project_id}/versions/{version_id}/stages/{stage_id}")
def delete_stage(project_id: int, version_id: int, stage_id: int, db: Session = Depends(get_db)):
    """Delete stage"""
    db_stage = db.query(Stage).filter(
        Stage.id == stage_id,
        Stage.version_id == version_id
    ).first()
    if not db_stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    db.delete(db_stage)
    db.commit()
    return {"message": "Stage deleted"}


# ============ Allocations ============

@router.post("/{project_id}/versions/{version_id}/stages/{stage_id}/allocations", response_model=StageAllocationResponse)
def create_allocation(
    project_id: int, version_id: int, stage_id: int,
    allocation: StageAllocationCreate,
    db: Session = Depends(get_db)
):
    """Create new allocation"""
    stage = db.query(Stage).filter(
        Stage.id == stage_id,
        Stage.version_id == version_id
    ).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    alloc_data = allocation.model_dump(exclude={'monthly_fte'})
    db_alloc = StageAllocation(stage_id=stage_id, **alloc_data)
    db.add(db_alloc)
    db.commit()
    db.refresh(db_alloc)

    # Create monthly FTE
    for fte in allocation.monthly_fte:
        db_fte = MonthlyFTE(allocation_id=db_alloc.id, **fte.model_dump())
        db.add(db_fte)

    db.commit()
    db.refresh(db_alloc)
    return db_alloc


@router.put("/{project_id}/versions/{version_id}/stages/{stage_id}/allocations/{alloc_id}", response_model=StageAllocationResponse)
def update_allocation(
    project_id: int, version_id: int, stage_id: int, alloc_id: int,
    allocation: StageAllocationUpdate,
    db: Session = Depends(get_db)
):
    """Update allocation"""
    db_alloc = db.query(StageAllocation).filter(
        StageAllocation.id == alloc_id,
        StageAllocation.stage_id == stage_id
    ).first()
    if not db_alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")

    update_data = allocation.model_dump(exclude_unset=True, exclude={'monthly_fte'})
    for field, value in update_data.items():
        setattr(db_alloc, field, value)

    # Update monthly FTE if provided
    if allocation.monthly_fte is not None:
        # Remove existing
        db.query(MonthlyFTE).filter(MonthlyFTE.allocation_id == alloc_id).delete()
        # Add new
        for fte in allocation.monthly_fte:
            db_fte = MonthlyFTE(allocation_id=alloc_id, **fte.model_dump())
            db.add(db_fte)

    db.commit()
    db.refresh(db_alloc)
    return db_alloc


@router.delete("/{project_id}/versions/{version_id}/stages/{stage_id}/allocations/{alloc_id}")
def delete_allocation(project_id: int, version_id: int, stage_id: int, alloc_id: int, db: Session = Depends(get_db)):
    """Delete allocation"""
    db_alloc = db.query(StageAllocation).filter(
        StageAllocation.id == alloc_id,
        StageAllocation.stage_id == stage_id
    ).first()
    if not db_alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")

    db.delete(db_alloc)
    db.commit()
    return {"message": "Allocation deleted"}


# ============ Cost Calculation ============

@router.get("/{project_id}/versions/{version_id}/calculate", response_model=CostCalculationResult)
def calculate_cost(project_id: int, version_id: int, db: Session = Depends(get_db)):
    """Calculate cost for a version"""
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id,
        ProjectVersion.project_id == project_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    return CostCalculatorService.calculate_version(db, version_id)
