"""
MODULE: CATALOG (DANH MỤC)
Quản lý: Khách hàng, Nhà cung cấp, Sản phẩm, Kho hàng, Tài khoản KT, Kỳ KT
"""
from sqlalchemy import Column, Integer, String, Numeric, Text, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.database import Base

# ============ CUSTOMER ============
class Customer(Base):
    """Khách hàng"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(100))
    tax_code = Column(String(20))
    credit_limit = Column(Numeric(15, 2), default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============ SUPPLIER ============
class Supplier(Base):
    """Nhà cung cấp"""
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(100))
    tax_code = Column(String(20))
    payment_term = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============ PRODUCT ============
class Product(Base):
    """Sản phẩm / Hàng hóa"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    unit = Column(String(20))
    category = Column(String(100))
    unit_price = Column(Numeric(15, 2))
    reorder_level = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============ WAREHOUSE ============
class Warehouse(Base):
    """Kho hàng - KHÔNG có updated_at"""
    __tablename__ = "warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(Text)
    manager_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============ CHART OF ACCOUNTS ============
class ChartOfAccounts(Base):
    """Tài khoản kế toán"""
    __tablename__ = "chart_of_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    account_code = Column(String(20), unique=True, nullable=False)
    account_name = Column(String(255), nullable=False)
    account_type = Column(String(50))
    is_detail = Column(Boolean, default=True)
    parent_account_code = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============ FISCAL PERIOD ============
class FiscalPeriod(Base):
    """Kỳ kế toán"""
    __tablename__ = "fiscal_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    period_code = Column(String(20), unique=True, nullable=False)
    period_name = Column(String(100))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_closed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Unit(Base):
    """Đơn vị tính - bảng units"""
    __tablename__ = "units"
 
    id          = Column(Integer, primary_key=True, index=True)
    code        = Column(String(50), unique=True, nullable=False, index=True)
    name        = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
 
    def __repr__(self):
        return f"<Unit {self.code} - {self.name}>"

class TransactionType(Base):
    """Loại giao dịch - bảng transaction_types"""
    __tablename__ = "transaction_types"

    id          = Column(Integer, primary_key=True, index=True)
    code        = Column(String(50), unique=True, nullable=False, index=True)
    name        = Column(String(100), nullable=False)
    nhom        = Column(String(10), nullable=False)  # THU / CHI / CA_HAI
    ap_dung_cho = Column(String(50), default="ALL")   # PT / PC / TTG / CTG / ALL
    mo_ta       = Column(Text, nullable=True)
    thu_tu      = Column(Integer, default=0)           # Thứ tự hiển thị
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<TransactionType {self.code} - {self.name}>"


class SystemConfig(Base):
    """Cấu hình hệ thống - bảng system_config (dùng chung cho tất cả danh mục nhỏ)"""
    __tablename__ = "system_config"

    id          = Column(Integer, primary_key=True, index=True)
    config_key  = Column(String(100), unique=True, nullable=False)
    config_name = Column(String(200))
    config_data = Column(JSONB, nullable=False, default=list)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)