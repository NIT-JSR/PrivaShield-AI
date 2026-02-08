import hashlib
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.sql import func

# --- 1. CONFIGURATION ---
# ⚠️ REPLACE with your real password!
DATABASE_URL = "mysql+pymysql://root:1234@localhost:3306/privacylens"
engine = create_engine(DATABASE_URL, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. THE MODEL (The Table) ---
class ProcessedSite(Base):
    __tablename__ = "processed_sites"

    id = Column(Integer, primary_key=True, index=True)
    url_hash = Column(String(64), unique=True, index=True) # The Lookup Key
    url = Column(Text, nullable=False)
    risk_summary = Column(Text, nullable=True)             # The AI Summary
    vector_index_path = Column(String(255), nullable=True) # Path to FAISS file
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# --- 3. DATABASE LOGIC (CRUD Functions) ---
def create_scan(db: Session, url: str, summary: str, index_path: str):
    """
    Inserts a new scan into MySQL.
    """
    # 1. Create the hash (MD5) to use as a unique key
    url_hash = hashlib.md5(url.encode()).hexdigest()

    # 2. Create the SQLAlchemy Object (NOT Pydantic)
    db_scan = ProcessedSite(
        url_hash=url_hash,
        url=url,
        risk_summary=summary,
        vector_index_path=index_path
    )
    
    # 3. Add and Commit
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    return db_scan

def get_scan_by_url(db: Session, url: str):
    """
    Checks if we have already processed this URL.
    Returns the scan object if found, otherwise None.
    """
    url_hash = hashlib.md5(url.encode()).hexdigest()
    
    # Query MySQL for this hash
    return db.query(ProcessedSite).filter(ProcessedSite.url_hash == url_hash).first()

def get_db():
    """Helper to open/close DB connections safely."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 4. INITIALIZATION ---
if __name__ == "__main__":
    print("Creating tables in MySQL...")
    Base.metadata.create_all(bind=engine)
    print("Done.")