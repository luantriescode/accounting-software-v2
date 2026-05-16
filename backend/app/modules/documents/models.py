"""
MODULE: DOCUMENTS (CHỨNG TỪ)
Quản lý: PT, PC, BC, BN, PNM, PBH, BL
"""
from sqlalchemy import Column, Integer, String, Numeric, Text, Boolean, Date, DateTime, ForeignKey, Computed
from datetime import datetime
from app.database import Base


class Document(Base):
    """Chứng từ master"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String(50), nullable=False)
    document_number = Column(String(50), nullable=False)
    document_date = Column(Date, nullable=False)
    period_id = Column(Integer, ForeignKey("fiscal_periods.id"))
    description = Column(Text)
    total_amount = Column(Numeric(15, 2), default=0)
    status = Column(String(20), default="DRAFT")
    posted_date = Column(DateTime)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Receipt(Base):
    __tablename__ = "receipts"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    amount = Column(Numeric(15, 2), nullable=False)
    payment_method = Column(String(50))
    transaction_type = Column(String(100), nullable=True)   # ✅ THÊM
    bank_account = Column(String(50))
    reference_number = Column(String(100))
    notes = Column(Text)


class Payment(Base):
    """Phiếu chi - KHÔNG có customer_id (chỉ có supplier_id)"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    amount = Column(Numeric(15, 2), nullable=False)
    payment_method = Column(String(50))
    transaction_type = Column(String(100), nullable=True) 
    bank_account = Column(String(50))
    reference_number = Column(String(100))
    notes = Column(Text)


class BankStatement(Base):
    """Báo có / Báo nợ"""
    __tablename__ = "bank_statements"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    statement_type = Column(String(10), nullable=False)  # BC / BN
    customer_id = Column(Integer, ForeignKey("customers.id"))
    amount = Column(Numeric(15, 2), nullable=False)
    transaction_type = Column(String(100))
    notes = Column(Text)


class SalesOrder(Base):
    """Phiếu bán hàng"""
    __tablename__ = "sales_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    serial_number = Column(String(50))
    invoice_number = Column(String(50))
    payment_method = Column(String(50))
    status = Column(String(50), default="DRAFT")
    total_amount = Column(Numeric(15, 2), default=0)
    paid_amount = Column(Numeric(15, 2), default=0)
    notes = Column(Text)


class RetailOrder(Base):
    """Phiếu bán lẻ"""
    __tablename__ = "retail_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    einvoice_status = Column(String(50))
    invoice_symbol = Column(String(50))
    invoice_number = Column(String(50))
    customer_name = Column(String(255))
    quantity = Column(Integer, default=0)
    total_amount = Column(Numeric(15, 2), default=0)
    notes = Column(Text)
    created_by = Column(String(100))


class PurchaseOrderItem(Base):
    """Chi tiết phiếu nhập mua"""
    __tablename__ = "purchase_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    chi_phi_phan_bo = Column(Numeric(15, 2), default=0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class SalesOrderItem(Base):
    """Chi tiết phiếu bán hàng"""
    __tablename__ = "sales_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    notes = Column(Text)
    gia_von = Column(Numeric(15, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class RetailOrderItem(Base):
    """Chi tiết phiếu bán lẻ"""
    __tablename__ = "retail_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    retail_order_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    notes = Column(Text)
    gia_von = Column(Numeric(15, 2), default=0)