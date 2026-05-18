"""
Schemas cho module Payroll - Nhân viên, Lương, Cấu hình BH
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date


# ============ EMPLOYEE ============
class EmployeeCreate(BaseModel):
    ma_nv: str
    ten_nv: str
    he_so_luong: float = 1.0
    luong_co_ban: float
    chuc_vu: Optional[str] = None
    phong_ban: Optional[str] = None
    ngay_vao_lam: Optional[date] = None
    so_tai_khoan: Optional[str] = None
    ngan_hang: Optional[str] = None

class EmployeeResponse(BaseModel):
    id: int
    ma_nv: str
    ten_nv: str
    he_so_luong: float
    luong_co_ban: float
    chuc_vu: Optional[str] = None
    phong_ban: Optional[str] = None


# ============ PAYROLL DETAIL ============
class PayrollDetailCreate(BaseModel):
    employee_id: int
    so_luong_sp: int = 0
    tien_luong_sp: float = 0
    so_cong: float = 0
    luong_thoi_gian: float = 0
    cong_nghi_tinh_luong: float = 0
    tien_luong_nghi: float = 0
    pc_tu_quy_luong: float = 0
    phu_cap_khac: float = 0
    tien_thuong: float = 0

class PayrollDetailResponse(BaseModel):
    id: int
    employee_id: int
    ma_nv: Optional[str] = None
    ten_nv: Optional[str] = None
    chuc_vu: Optional[str] = None
    phong_ban: Optional[str] = None
    he_so_luong: float = 1.0
    so_luong_sp: int = 0
    tien_luong_sp: float = 0
    so_cong: float = 0
    luong_thoi_gian: float = 0
    cong_nghi_tinh_luong: float = 0
    tien_luong_nghi: float = 0
    pc_tu_quy_luong: float = 0
    phu_cap_khac: float = 0
    tien_thuong: float = 0
    tong_tien: float = 0
    tru_bhxh: float = 0
    tru_bhyt: float = 0
    tru_bhtn: float = 0
    tru_thue_tncn: float = 0
    tong_tru: float = 0
    thuc_lanh: float = 0


# ============ PAYROLL MASTER ============
class PayrollCreate(BaseModel):
    so_chung_tu: str
    ngay_chung_tu: date
    ky_ke_toan_id: int
    dien_giai: Optional[str] = None
    details: list[PayrollDetailCreate]

class PayrollResponse(BaseModel):
    id: int
    so_chung_tu: str
    ngay_chung_tu: date
    ky_ke_toan_id: int
    dien_giai: Optional[str] = None
    tong_thu_nhap: float
    tong_giam_tru: float
    tong_thuc_lanh: float
    trang_thai: str
    ten_nv_list: Optional[list[str]] = None
    details: Optional[list[PayrollDetailResponse]] = None

class PayrollUpdate(BaseModel):
    so_chung_tu: str
    ngay_chung_tu: date
    ky_ke_toan_id: int
    dien_giai: Optional[str] = None
    details: list[PayrollDetailCreate]

# ============ PAYROLL CONFIG ============
class PayrollConfigUpdate(BaseModel):
    ty_le_bhxh: float = 8.0
    ty_le_bhyt: float = 1.5
    ty_le_bhtn: float = 1.0
    luong_co_so: float = 2340000
    giam_tru_gia_canh: float = 11000000
    giam_tru_phu_thuoc: float = 4400000

class PayrollConfigResponse(BaseModel):
    id: int
    ty_le_bhxh: float
    ty_le_bhyt: float
    ty_le_bhtn: float
    luong_co_so: float
    giam_tru_gia_canh: float
    giam_tru_phu_thuoc: float