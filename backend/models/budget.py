from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    mp_name = Column(String(100), default="Aditi Sharma")
    constituency = Column(String(100), default="Pune Urban")
    fiscal_year = Column(String(10), default="2024-25")

    # MPLADS allocation
    total_allocation_lakhs = Column(Float, default=500.0)   # standard MPLADS ₹5 Cr = 500 lakhs
    amount_used_lakhs = Column(Float, default=120.0)
    amount_remaining_lakhs = Column(Float, default=380.0)

    notes = Column(Text, nullable=True)
    data_source = Column(String(200), default="Synthetic — structured like MPLADS guidelines (₹5 Cr/year per MP)")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
