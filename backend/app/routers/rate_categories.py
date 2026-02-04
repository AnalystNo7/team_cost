from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import RateCategory
from app.schemas import RateCategoryCreate, RateCategoryUpdate, RateCategoryResponse

router = APIRouter(prefix="/rate-categories", tags=["Rate Categories"])


@router.get("/", response_model=List[RateCategoryResponse])
def get_rate_categories(db: Session = Depends(get_db), include_inactive: bool = False):
    """Get all rate categories"""
    query = db.query(RateCategory)
    if not include_inactive:
        query = query.filter(RateCategory.is_active == True)
    return query.order_by(RateCategory.code).all()


@router.get("/{category_id}", response_model=RateCategoryResponse)
def get_rate_category(category_id: int, db: Session = Depends(get_db)):
    """Get rate category by ID"""
    category = db.query(RateCategory).filter(RateCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Rate category not found")
    return category


@router.post("/", response_model=RateCategoryResponse)
def create_rate_category(category: RateCategoryCreate, db: Session = Depends(get_db)):
    """Create new rate category"""
    existing = db.query(RateCategory).filter(RateCategory.code == category.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rate category with this code already exists")

    db_category = RateCategory(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/{category_id}", response_model=RateCategoryResponse)
def update_rate_category(category_id: int, category: RateCategoryUpdate, db: Session = Depends(get_db)):
    """Update rate category"""
    db_category = db.query(RateCategory).filter(RateCategory.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Rate category not found")

    update_data = category.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)

    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}")
def delete_rate_category(category_id: int, db: Session = Depends(get_db)):
    """Delete rate category (soft delete)"""
    db_category = db.query(RateCategory).filter(RateCategory.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Rate category not found")

    db_category.is_active = False
    db.commit()
    return {"message": "Rate category deactivated"}
