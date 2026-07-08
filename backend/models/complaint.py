from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class ComplaintChannel(str, enum.Enum):
    voice = "voice"
    text = "text"
    whatsapp = "whatsapp"
    social = "social"
    email = "email"
    portal = "portal"


class ComplaintUrgency(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    raw_text = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    channel = Column(String(20), default="portal")
    translated_text = Column(Text)
    issue_category = Column(String(50))
    urgency = Column(String(20), default="medium")
    sentiment = Column(Float, default=0.0)  # -1.0 to 1.0
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    lat = Column(Float)
    lng = Column(Float)
    location_name = Column(String(200))
    media_urls = Column(JSON, default=list)
    entities = Column(JSON, default=dict)  # extracted entities from Claude
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    ward = relationship("Ward", back_populates="complaints")
    project = relationship("Project", back_populates="complaints")
