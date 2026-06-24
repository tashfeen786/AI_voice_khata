from sqlalchemy.orm import Session
from . import models, schemas

def get_customer_by_phone(db: Session, phone: str):
    return db.query(models.Customer).filter(models.Customer.phone == phone).first()

def get_or_create_customer(db: Session, name: str, phone: str = None, urdu_name: str = None):
    if phone:
        customer = get_customer_by_phone(db, phone)
        if customer:
            return customer
    customer = models.Customer(name=name, phone=phone, urdu_name=urdu_name)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

def add_ledger_entry(db: Session, entry: schemas.LedgerEntryCreate):
    db_entry = models.LedgerEntry(**entry.dict())
    db.add(db_entry)
    # Update customer balance
    customer = db.query(models.Customer).filter(models.Customer.id == entry.customer_id).first()
    if entry.type == 'credit':
        customer.outstanding_balance += entry.amount
    else:
        customer.outstanding_balance -= entry.amount
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_customer_ledger(db: Session, customer_id: str, limit: int = 50):
    return db.query(models.LedgerEntry).filter(models.LedgerEntry.customer_id == customer_id).order_by(models.LedgerEntry.created_at.desc()).limit(limit).all()

def get_all_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()