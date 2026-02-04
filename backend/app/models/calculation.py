from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class MethodologyType(str, enum.Enum):
    WATERFALL = "waterfall"
    AGILE = "agile"


class Calculation(Base):
    __tablename__ = "calculations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    methodology = Column(Enum(MethodologyType), nullable=False)
    start_date = Column(String(7), nullable=False)  # YYYY-MM format
    end_date = Column(String(7), nullable=False)  # YYYY-MM format
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    versions = relationship("CalculationVersion", back_populates="calculation", cascade="all, delete-orphan")


class CalculationVersion(Base):
    __tablename__ = "calculation_versions"

    id = Column(Integer, primary_key=True, index=True)
    calculation_id = Column(Integer, ForeignKey("calculations.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    name = Column(String(100), nullable=True)  # e.g., "Базовая версия", "Актуализация Q2"
    notes = Column(Text, nullable=True)
    is_baseline = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    calculation = relationship("Calculation", back_populates="versions")
    stages = relationship("Stage", back_populates="version", cascade="all, delete-orphan")
