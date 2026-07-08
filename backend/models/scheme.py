from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    short_name = Column(String(50))
    ministry = Column(String(200))
    description = Column(Text)
    category = Column(String(50))  # water, roads, health, education, sanitation, electricity, housing
    funding_ceiling_lakhs = Column(Float)   # in Indian Lakhs (₹)
    cofunding_pct = Column(Float, default=0.0)  # % covered by scheme
    eligibility_criteria = Column(JSON, default=dict)  # {min_population, categories, states, etc.}
    status = Column(String(20), default="active")  # active / closed
    data_source = Column(String(200), default="Synthetic — structured like real GoI scheme data")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="matched_scheme")
