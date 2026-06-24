from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    urdu_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    outstanding_balance: float
    created_at: datetime

    class Config:
        from_attributes = True

class LedgerEntryCreate(BaseModel):
    customer_id: str
    amount: float
    type: str  # 'credit' or 'debit'
    description: Optional[str] = None
    reference_number: Optional[str] = None

class LedgerEntryResponse(LedgerEntryCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True