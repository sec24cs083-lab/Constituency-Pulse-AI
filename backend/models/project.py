from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    category = Column(String(50))  # water, roads, health, education, sanitation, electricity, housing

    # Cost
    estimated_cost_lakhs = Column(Float)  # in Indian Lakhs (₹)
    matched_scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=True)
    scheme_cofunding_lakhs = Column(Float, default=0.0)
    net_cost_lakhs = Column(Float)  # estimated_cost - scheme_cofunding

    # Impact
    population_affected = Column(Integer, default=0)
    infra_evidence = Column(Text)          # human-readable evidence string
    infra_evidence_source = Column(String(200))  # dataset reference

    # Risk
    delay_risk = Column(String(20), default="medium")  # low / medium / high

    # Priority Score (deterministic formula output)
    priority_score = Column(Float, default=0.0)  # 0-100
    score_breakdown = Column(JSON, default=dict)  # {factor: {value, weight, weighted_score}}

    # Status
    status = Column(String(30), default="proposed")  # proposed / funded / in_progress / completed
    is_funded = Column(Boolean, default=False)  # selected by optimizer

    # AI-generated summary (from Claude, grounded in score_breakdown)
    ai_summary = Column(Text, nullable=True)
    ai_summary_input_log = Column(JSON, nullable=True)  # auditability: exact input sent to Claude

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    ward = relationship("Ward", back_populates="projects")
    complaints = relationship("Complaint", back_populates="project")
    matched_scheme = relationship("Scheme", back_populates="projects")
