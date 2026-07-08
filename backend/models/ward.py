from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    constituency_name = Column(String(100), default="Pune Urban")
    mp_name = Column(String(100), default="Aditi Sharma")

    # Demographics (mock Census-style data)
    population = Column(Integer, default=0)
    households = Column(Integer, default=0)
    literacy_rate = Column(Float, default=0.0)   # 0-100
    sc_st_percentage = Column(Float, default=0.0) # Scheduled Caste/Tribe %

    # Infrastructure status (mock PMGSY/JJM-style)
    road_coverage_pct = Column(Float, default=0.0)      # % of roads paved
    water_access_pct = Column(Float, default=0.0)       # % with piped water
    electricity_pct = Column(Float, default=0.0)        # % electrified
    school_count = Column(Integer, default=0)
    health_centre_count = Column(Integer, default=0)
    drainage_coverage_pct = Column(Float, default=0.0)

    # Geo
    lat = Column(Float)
    lng = Column(Float)
    boundary_geojson = Column(JSON)  # GeoJSON polygon for map rendering

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    complaints = relationship("Complaint", back_populates="ward")
    projects = relationship("Project", back_populates="ward")
