from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Role
from app.schemas import RoleCreate, RoleUpdate, RoleResponse

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/", response_model=List[RoleResponse])
def get_roles(db: Session = Depends(get_db), include_inactive: bool = False):
    """Get all roles"""
    query = db.query(Role)
    if not include_inactive:
        query = query.filter(Role.is_active == True)
    return query.order_by(Role.name).all()


@router.get("/{role_id}", response_model=RoleResponse)
def get_role(role_id: int, db: Session = Depends(get_db)):
    """Get role by ID"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.post("/", response_model=RoleResponse)
def create_role(role: RoleCreate, db: Session = Depends(get_db)):
    """Create new role"""
    existing = db.query(Role).filter(Role.name == role.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role with this name already exists")

    db_role = Role(**role.model_dump())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, role: RoleUpdate, db: Session = Depends(get_db)):
    """Update role"""
    db_role = db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    update_data = role.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_role, field, value)

    db.commit()
    db.refresh(db_role)
    return db_role


@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    """Delete role (soft delete)"""
    db_role = db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    db_role.is_active = False
    db.commit()
    return {"message": "Role deactivated"}
