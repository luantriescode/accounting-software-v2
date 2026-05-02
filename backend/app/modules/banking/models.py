"""
MODULE: BANKING (NGÂN HÀNG - TTG/CTG)
Quản lý: Thu tiền gửi, Chi tiền gửi, Tài khoản ngân hàng, Số dư TK
"""
from sqlalchemy import Column, Integer, String, Numeric, Text, Boolean, Date, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class BankAccount(Base):
    """Tài khoản ngân hàng"""
    __tablename__ = "bank_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    ma_tk = Column(String(50), unique=True, nullable=False)  # NH1, NH2, TM...
    ten_tk = Column(String(255), nullable=False)  # Tiền gửi NH1, Tiền mặt...
    loai_tk = Column(String(50), nullable=False)  # NH (Ngân hàng), TM (Tiền mặt)
    ngan_hang = Column(String(100))  # Tên ngân hàng (nếu loại NH)
    so_tai_khoan = Column(String(50))  # Số tài khoản
    chu_tai_khoan = Column(String(100))  # Chủ tài khoản
    so_du_hien_tai = Column(Numeric(15, 2), default=0)  # Số dư hiện tại
    con_hoat_dong = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BankBalance(Base):
    """Lịch sử số dư tài khoản"""
    __tablename__ = "bank_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    tk_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False)
    period_id = Column(Integer, ForeignKey("fiscal_periods.id"))
    
    # Số dư
    so_du_dau_ky = Column(Numeric(15, 2), default=0)
    so_du_cuoi_ky = Column(Numeric(15, 2), default=0)
    
    # Giao dịch
    tong_thu = Column(Numeric(15, 2), default=0)
    tong_chi = Column(Numeric(15, 2), default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BankReceiptTransaction(Base):
    """Thu tiền gửi (TTG)"""
    __tablename__ = "bank_receipt_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    
    # Header
    tk_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False)
    loai_giao_dich = Column(String(100), nullable=False)  # Dropdown: thu nợ, thu bán hàng, thu chuyển quỹ, thu khác
    so_chung_tu = Column(String(50), nullable=False)
    khach_hang_id = Column(Integer, ForeignKey("customers.id"))
    dia_chi = Column(String(500))
    ngay_chung_tu = Column(Date, nullable=False)
    nguoi_giao_dich = Column(String(100))
    dien_giai = Column(Text)
    
    # Chi tiết
    so_tien_thu = Column(Numeric(15, 2), nullable=False)
    noi_dung = Column(Text)
    
    # Đối chiếu
    phieu_thu_id = Column(Integer, ForeignKey("receipts.id"))  # Liên kết đến phiếu thu
    da_doi_chieu = Column(Boolean, default=False)
    
    period_id = Column(Integer, ForeignKey("fiscal_periods.id"))
    trang_thai = Column(String(20), default="DRAFT")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BankPaymentTransaction(Base):
    """Chi tiền gửi (CTG)"""
    __tablename__ = "bank_payment_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    
    # Header
    tk_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False)
    loai_giao_dich = Column(String(100), nullable=False)  # Dropdown: chi nợ, chi lương, chi thuế, trả thừa, chi mua, chi khác
    so_chung_tu = Column(String(50), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    dia_chi = Column(String(500))
    ngay_chung_tu = Column(Date, nullable=False)
    nguoi_giao_dich = Column(String(100))
    dien_giai = Column(Text)
    
    # Chi tiết
    so_tien_chi = Column(Numeric(15, 2), nullable=False)
    noi_dung = Column(Text)
    ma_phi = Column(String(50))  # Cost item code (nếu chi mua hàng)
    
    # Đối chiếu
    phieu_chi_id = Column(Integer, ForeignKey("payments.id"))  # Liên kết đến phiếu chi
    da_doi_chieu = Column(Boolean, default=False)
    
    period_id = Column(Integer, ForeignKey("fiscal_periods.id"))
    trang_thai = Column(String(20), default="DRAFT")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)