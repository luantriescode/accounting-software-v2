"""
MODULE: INVENTORY (HÀNG TỒN KHO - HTK)
Quản lý: Tính giá HTK, Báo cáo tồn kho (AVG + FIFO)
"""
from sqlalchemy import Column, Integer, String, Numeric, Text, Boolean, Date, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class InventoryValuationConfig(Base):
    """Cấu hình phương pháp tính giá HTK"""
    __tablename__ = "inventory_valuation_config"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, default=1)
    valuation_method = Column(String(20), nullable=False, default='AVG')  # AVG hoặc FIFO
    effective_from = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class InventoryValuationResult(Base):
    """Kết quả tính giá HTK"""
    __tablename__ = "inventory_valuation_results"
    
    id = Column(Integer, primary_key=True, index=True)
    period_from = Column(Date, nullable=False)
    period_to = Column(Date, nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    valuation_method = Column(String(20), nullable=False)  # AVG hoặc FIFO
    
    # Tồn đầu kỳ
    opening_qty = Column(Numeric(15, 3), default=0)
    opening_value = Column(Numeric(15, 2), default=0)
    
    # Nhập trong kỳ
    import_qty = Column(Numeric(15, 3), default=0)
    import_value = Column(Numeric(15, 2), default=0)
    
    # Xuất trong kỳ
    export_qty = Column(Numeric(15, 3), default=0)
    export_value = Column(Numeric(15, 2), default=0)
    
    # Tồn cuối kỳ
    closing_qty = Column(Numeric(15, 3), default=0)
    closing_value = Column(Numeric(15, 2), default=0)
    
    # Đơn giá bình quân
    unit_price = Column(Numeric(15, 4), default=0)
    
    # Timestamp
    calculated_at = Column(DateTime, default=datetime.utcnow)