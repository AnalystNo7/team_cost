from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Numeric, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class StageType(str, enum.Enum):
    # Waterfall stages
    INITIATION = "initiation"  # Этап 0. Инициирование
    ELABORATION = "elaboration"  # Этап 1. Проработка
    # Этап 2. Создание и внедрение (substages)
    DESIGN = "design"  # 2.1 Проектирование
    DEVELOPMENT = "development"  # 2.2 Разработка и внедрение
    PILOT = "pilot"  # 2.3 Опытная эксплуатация
    EXPANSION = "expansion"  # Этап 3. Развитие и тиражирование
    CLOSURE = "closure"  # Этап 4. Завершение

    # Agile-specific stages
    MVP_CREATION = "mvp_creation"  # Создание MVP
    MVP_PILOT = "mvp_pilot"  # Опытная эксплуатация и доработка MVP


class ResourceType(str, enum.Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"


class Stage(Base):
    __tablename__ = "stages"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("project_versions.id"), nullable=False)
    stage_type = Column(Enum(StageType), nullable=False)
    name = Column(String(100), nullable=True)  # Custom name override
    order_index = Column(Integer, nullable=False)  # For ordering, especially for repeated stages
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    version = relationship("ProjectVersion", back_populates="stages")
    allocations = relationship("StageAllocation", back_populates="stage", cascade="all, delete-orphan")


class StageAllocation(Base):
    """Team member allocation within a stage"""
    __tablename__ = "stage_allocations"

    id = Column(Integer, primary_key=True, index=True)
    stage_id = Column(Integer, ForeignKey("stages.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    rate_category_id = Column(Integer, ForeignKey("rate_categories.id"), nullable=True)  # For external rate

    resource_type = Column(Enum(ResourceType), nullable=False)
    employee_name = Column(String(255), nullable=True)  # Optional employee name

    # For internal resources - cost calculation
    monthly_salary = Column(Numeric(12, 2), nullable=True)  # Monthly gross salary
    bonus_percent = Column(Numeric(5, 2), default=0)  # Annual bonus as % of yearly salary

    # For external resources - fixed cost option
    fixed_monthly_cost = Column(Numeric(12, 2), nullable=True)  # Fixed monthly contractor cost

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    stage = relationship("Stage", back_populates="allocations")
    role = relationship("Role")
    rate_category = relationship("RateCategory")
    monthly_fte = relationship("MonthlyFTE", back_populates="allocation", cascade="all, delete-orphan")


class MonthlyFTE(Base):
    """Monthly FTE allocation for a team member"""
    __tablename__ = "monthly_fte"

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("stage_allocations.id"), nullable=False)
    year_month = Column(String(7), nullable=False)  # YYYY-MM
    fte_value = Column(Numeric(4, 2), nullable=False)  # 0.00 - 1.00

    allocation = relationship("StageAllocation", back_populates="monthly_fte")
