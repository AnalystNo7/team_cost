from sqlalchemy import Column, Integer, String, Enum, DateTime, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class MethodologyType(str, enum.Enum):
    WATERFALL = "waterfall"
    AGILE = "agile"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    methodology = Column(Enum(MethodologyType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    versions = relationship("ProjectVersion", back_populates="project", cascade="all, delete-orphan")
