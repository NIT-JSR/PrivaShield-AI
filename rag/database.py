import os
import hashlib
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.sql import func

# --- 1. CONFIGURATION ---
# Use DATABASE_URL from environment (e.g. Render MySQL), otherwise fallback to local SQLite
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    STORAGE_DIR = "storage"
    os.makedirs(STORAGE_DIR, exist_ok=True)
    DATABASE_PATH = os.path.join(STORAGE_DIR, "privashield.db")
    DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
    print(f"Using local SQLite database at {DATABASE_PATH}")
else:
    # Ensure DATABASE_URL is compatible with SQLAlchemy 2.0 (replace postgres:// with postgresql:// if needed)
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    print("Using external database from DATABASE_URL")

# Connect arguments only needed for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, pool_recycle=3600, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. THE MODEL ---
class ProcessedSite(Base):
    __tablename__ = "processed_sites"

    id = Column(Integer, primary_key=True, index=True)
    url_hash = Column(String(64), unique=True, index=True)
    url = Column(Text, nullable=False)
    risk_summary = Column(Text, nullable=True) # Matches database_lite schema
    vector_index_path = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# --- 3. DATABASE LOGIC ---
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
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database ready.")

if __name__ == "__main__":
    init_db()