"""
MODULE: WAREHOUSE (KHO HÀNG)
Quản lý: PNK, PXK, Chi phí mua hàng, Tồn kho
"""
from sqlalchemy import Column, Integer, String, Numeric, Text, Boolean, Date, DateTime, ForeignKey, Computed
from datetime import datetime
from app.database import Base


class CostItem(Base):
    """Danh mục chi phí mua hàng (CPMH)"""
    __tablename__ = "cost_items"
    id = Column(Integer, primary_key=True, index=True)
    ma_chi_phi = Column(String(50), unique=True, nullable=False)
    ten_chi_phi = Column(String(255), nullable=False)
    tinh_chat = Column(String(50), default="dich_vu")
    phan_bo_theo = Column(String(50))
    con_hoat_dong = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WarehouseReceipt(Base):
    """Phiếu nhập kho"""
    __tablename__ = "warehouse_receipts"
    id = Column(Integer, primary_key=True, index=True)
    loai_phieu_nhap = Column(String(50), nullable=False)
    so_phieu_nhap = Column(String(50), nullable=False)
    ngay_phieu_nhap = Column(Date, nullable=False)
    nha_cung_cap_id = Column(Integer, ForeignKey("suppliers.id"))
    dia_chi = Column(String(500))
    nguoi_giao_dich = Column(String(100))
    dien_giai = Column(Text)
    period_id = Column(Integer, ForeignKey("fiscal_periods.id"), nullable=False)
    tong_tien = Column(Numeric(15, 2), default=0)
    tong_so_luong = Column(Integer, default=0)
    trang_thai = Column(String(20), default="DRAFT")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WarehouseReceiptItem(Base):
    """Chi tiết hàng nhập kho"""
    __tablename__ = "warehouse_receipt_items"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("warehouse_receipts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    total_amount = Column(Numeric(15, 2), Computed("quantity * unit_price", persisted=True))
    current_stock = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class WarehouseReceiptCost(Base):
    """Chi phí nhập kho"""
    __tablename__ = "warehouse_receipt_costs"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("warehouse_receipts.id", ondelete="CASCADE"), nullable=False)
    cost_item_id = Column(Integer, ForeignKey("cost_items.id"), nullable=False)
    ngay_phieu_nhap = Column(Date, nullable=False)
    so_phieu_nhap = Column(String(50), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    tong_chi_phi = Column(Numeric(15, 2), nullable=False)
    so_phan_bo_lan_nay = Column(Numeric(15, 2), nullable=False)
    luyek_so_da_phan_bo = Column(Numeric(15, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class WarehouseIssue(Base):
    """Phiếu xuất kho"""
    __tablename__ = "warehouse_issues"
    id = Column(Integer, primary_key=True, index=True)
    loai_phieu_xuat = Column(String(50), nullable=False)
    so_phieu_xuat = Column(String(50), nullable=False)
    ngay_phieu_xuat = Column(Date, nullable=False)
    khach_hang_id = Column(Integer, ForeignKey("customers.id"))
    ten_khach_le = Column(String(255), nullable=True)
    dia_chi = Column(String(500))
    nguoi_giao_dich = Column(String(100))
    dien_giai = Column(Text)
    period_id = Column(Integer, ForeignKey("fiscal_periods.id"), nullable=False)
    tong_tien = Column(Numeric(15, 2), default=0)
    tong_so_luong = Column(Integer, default=0)
    trang_thai = Column(String(20), default="DRAFT")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WarehouseIssueItem(Base):
    """Chi tiết hàng xuất kho"""
    __tablename__ = "warehouse_issue_items"
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("warehouse_issues.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    total_amount = Column(Numeric(15, 2), Computed("quantity * unit_price", persisted=True))
    current_stock = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class StockSummary(Base):
    """Tồn kho theo sản phẩm + kho + kỳ"""
    __tablename__ = "stock_summaries"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    period_id = Column(Integer, ForeignKey("fiscal_periods.id"), nullable=False)
    ton_dau_ky_sl = Column(Integer, default=0)
    ton_dau_ky_gia_tri = Column(Numeric(15, 2), default=0)
    nhap_trong_ky_sl = Column(Integer, default=0)
    nhap_trong_ky_gia_tri = Column(Numeric(15, 2), default=0)
    xuat_trong_ky_sl = Column(Integer, default=0)
    xuat_trong_ky_gia_tri = Column(Numeric(15, 2), default=0)
    ton_cuoi_ky_sl = Column(Integer, default=0)
    ton_cuoi_ky_gia_tri = Column(Numeric(15, 2), default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)