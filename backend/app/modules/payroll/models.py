"""
MODULE: PAYROLL (LƯƠNG & BẢO HIỂM)
Quản lý: Nhân viên, Chứng từ lương, Cấu hình BH
"""
from sqlalchemy import Column, Integer, String, Numeric, Text, Boolean, Date, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class Employee(Base):
    """Nhân viên"""
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    ma_nv = Column(String(50), unique=True, nullable=False)
    ten_nv = Column(String(255), nullable=False)
    he_so_luong = Column(Numeric(5, 2), default=1.00)
    luong_co_ban = Column(Numeric(15, 2), default=0)
    chuc_vu = Column(String(100))
    phong_ban = Column(String(100))
    ngay_vao_lam = Column(Date)
    so_tai_khoan = Column(String(50))
    ngan_hang = Column(String(100))
    con_hoat_dong = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PayrollMaster(Base):
    """Chứng từ lương (master)"""
    __tablename__ = "payroll_master"
    id = Column(Integer, primary_key=True, index=True)
    so_chung_tu = Column(String(50), nullable=False)
    ngay_chung_tu = Column(Date, nullable=False)
    dien_giai = Column(Text)
    period_id = Column(Integer, ForeignKey("fiscal_periods.id"), nullable=False)
    tong_thu_nhap = Column(Numeric(15, 2), default=0)
    tong_giam_tru = Column(Numeric(15, 2), default=0)
    tong_thuc_lanh = Column(Numeric(15, 2), default=0)
    trang_thai = Column(String(20), default="DRAFT")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PayrollDetail(Base):
    """Chi tiết lương từng nhân viên"""
    __tablename__ = "payroll_details"
    id = Column(Integer, primary_key=True, index=True)
    payroll_id = Column(Integer, ForeignKey("payroll_master.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    he_so_luong = Column(Numeric(5, 2), default=0)
    so_luong_sp = Column(Integer, default=0)
    tien_luong_sp = Column(Numeric(15, 2), default=0)
    so_cong = Column(Numeric(5, 1), default=0)
    luong_thoi_gian = Column(Numeric(15, 2), default=0)
    cong_nghi_tinh_luong = Column(Numeric(5, 1), default=0)
    tien_luong_nghi = Column(Numeric(15, 2), default=0)
    pc_tu_quy_luong = Column(Numeric(15, 2), default=0)
    phu_cap_khac = Column(Numeric(15, 2), default=0)
    tien_thuong = Column(Numeric(15, 2), default=0)
    tong_tien = Column(Numeric(15, 2), default=0)
    tru_bhxh = Column(Numeric(15, 2), default=0)
    tru_bhyt = Column(Numeric(15, 2), default=0)
    tru_bhtn = Column(Numeric(15, 2), default=0)
    tru_thue_tncn = Column(Numeric(15, 2), default=0)
    tong_tru = Column(Numeric(15, 2), default=0)
    thuc_lanh = Column(Numeric(15, 2), default=0)
    ghi_chu = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class PayrollConfig(Base):
    """Cấu hình tỷ lệ bảo hiểm"""
    __tablename__ = "payroll_config"
    id = Column(Integer, primary_key=True, index=True)
    ty_le_bhxh = Column(Numeric(5, 2), default=8.00)
    ty_le_bhyt = Column(Numeric(5, 2), default=1.50)
    ty_le_bhtn = Column(Numeric(5, 2), default=1.00)
    luong_co_so = Column(Numeric(15, 2), default=2340000)
    giam_tru_gia_canh = Column(Numeric(15, 2), default=11000000)
    giam_tru_phu_thuoc = Column(Numeric(15, 2), default=4400000)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)