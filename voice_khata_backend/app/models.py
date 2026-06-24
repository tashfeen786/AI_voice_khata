from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from .database import Base
import uuid
from datetime import datetime

class Customer(Base):
    __tablename__ = "customers"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    urdu_name = Column(String, nullable=True)
    phone = Column(String, unique=True, index=True)
    address = Column(String, nullable=True)
    outstanding_balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String, ForeignKey("customers.id"), index=True)
    amount = Column(Float, nullable=False)
    type = Column(String)  # 'credit' (udhaar given), 'debit' (payment received)
    description = Column(String, nullable=True)
    reference_number = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)