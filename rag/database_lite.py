"""
PrivaShield AI - Database Module (SQLite Version)
Drop-in replacement for database.py that uses SQLite instead of MySQL.
Zero-config — no external database server needed.
"""

import os
import hashlib
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.sql import func

# --- 1. CONFIGURATION ---
STORAGE_DIR = "storage"
os.makedirs(STORAGE_DIR, exist_ok=True)

DATABASE_PATH = os.path.join(STORAGE_DIR, "privashield.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# --- 2. THE MODEL (Same schema as MySQL version) ---
class ProcessedSite(Base):
    __tablename__ = "processed_sites"

    id = Column(Integer, primary_key=True, index=True)
    url_hash = Column(String(64), unique=True, index=True)
    url = Column(Text, nullable=False)
    risk_summary = Column(Text, nullable=True)
    vector_index_path = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- 3. DATABASE LOGIC (Same CRUD as MySQL version) ---
def create_scan(db: Session, url: str, summary: str, index_path: str):
    url_hash = hashlib.md5(url.encode()).hexdigest()
    db_scan = ProcessedSite(
        url_hash=url_hash,
        url=url,
        risk_summary=summary,
        vector_index_path=index_path
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    return db_scan


def get_scan_by_url(db: Session, url: str):
    url_hash = hashlib.md5(url.encode()).hexdigest()
    return db.query(ProcessedSite).filter(ProcessedSite.url_hash == url_hash).first()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- 4. INITIALIZATION ---
def init_db():
    print(f"Initializing SQLite database at {DATABASE_PATH}...")
    Base.metadata.create_all(bind=engine)
    print("Database ready.")


if __name__ == "__main__":
    init_db()
