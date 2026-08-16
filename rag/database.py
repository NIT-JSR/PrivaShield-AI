import os
import hashlib
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from sqlalchemy.sql import func
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

# --- 2. THE MODELS ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable if registered via OAuth
    name = Column(String(100), nullable=True)
    oauth_provider = Column(String(50), nullable=True)
    oauth_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    history = relationship("UserHistory", back_populates="user", cascade="all, delete-orphan")


class UserHistory(Base):
    __tablename__ = "user_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    url = Column(Text, nullable=False)
    url_hash = Column(String(64), nullable=False)
    grade = Column(String(5), nullable=True)
    score = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="history")


class ProcessedSite(Base):
    __tablename__ = "processed_sites"

    id = Column(Integer, primary_key=True, index=True)
    url_hash = Column(String(64), unique=True, index=True)
    url = Column(Text, nullable=False)
    risk_summary = Column(Text, nullable=True) # Matches database_lite schema
    vector_index_path = Column(String(255), nullable=True)
    policy_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# --- 3. DATABASE LOGIC ---
def create_scan(db: Session, url: str, summary: str, index_path: str, policy_text: str = None):
    url_hash = hashlib.md5(url.encode()).hexdigest()
    db_scan = ProcessedSite(
        url_hash=url_hash,
        url=url,
        risk_summary=summary,
        vector_index_path=index_path,
        policy_text=policy_text
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