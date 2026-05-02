from sqlalchemy import create_engine, Column, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from app.config import settings

# DATABASE URL từ Supabase
DATABASE_URL = settings.DATABASE_URL

# Tạo engine
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ============ BASE CLASSES ============

# Base - cho các bảng ĐÃ TỒN TẠI trong DB (không có created_at/updated_at)
Base = declarative_base()

# BaseModel - cho các bảng TỰ TẠO (có id, created_at, updated_at)
class BaseModel(Base):
    """
    Base model cho các bảng tự tạo.
    Tự động thêm:
    - id: Primary Key
    - created_at: Timestamp tạo
    - updated_at: Timestamp sửa đổi
    """
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Dependency function
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()