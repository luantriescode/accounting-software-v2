"""
FIX: Thêm validator so_tien > 0 trong banking schemas
Paste vào app/modules/banking/schemas.py
"""
from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import date


class BankAccountCreate(BaseModel):
    ma_tk: str
    ten_tk: str
    loai_tk: str
    ngan_hang: Optional[str] = None
    so_tai_khoan: Optional[str] = None
    chu_tai_khoan: Optional[str] = None
    so_du_hien_tai: float = Field(default=0, ge=0, description="Số dư >= 0")

class BankAccountResponse(BaseModel):
    id: int
    ma_tk: str
    ten_tk: str
    loai_tk: str
    ngan_hang: Optional[str] = None
    so_tai_khoan: Optional[str] = None
    chu_tai_khoan: Optional[str] = None
    so_du_hien_tai: float
    con_hoat_dong: bool


class BankReceiptTransactionCreate(BaseModel):
    tk_id: int
    loai_giao_dich: str
    so_chung_tu: str
    khach_hang_id: Optional[int] = None
    dia_chi: Optional[str] = None
    ngay_chung_tu: date
    nguoi_giao_dich: Optional[str] = None
    dien_giai: Optional[str] = None
    # FIX: gt=0 → số tiền PHẢI > 0
    so_tien_thu: float = Field(..., gt=0, description="Số tiền thu phải lớn hơn 0")
    noi_dung: Optional[str] = None
    phieu_thu_id: Optional[int] = None
    period_id: int

# TÌM class BankReceiptTransactionResponse và THAY TOÀN BỘ:
class BankReceiptTransactionResponse(BaseModel):
    id: int
    so_chung_tu: str
    ngay_chung_tu: date
    loai_giao_dich: str
    so_tien_thu: float
    noi_dung: Optional[str] = None
    da_doi_chieu: bool
    trang_thai: str
    tk_id: Optional[int] = None        # ✅ THÊM
    ten_tk: Optional[str] = None       # ✅ THÊM
    ma_tk: Optional[str] = None        # ✅ THÊM


class BankPaymentTransactionCreate(BaseModel):
    tk_id: int
    loai_giao_dich: str
    so_chung_tu: str
    supplier_id: Optional[int] = None
    dia_chi: Optional[str] = None
    ngay_chung_tu: date
    nguoi_giao_dich: Optional[str] = None
    dien_giai: Optional[str] = None
    # FIX: gt=0 → số tiền PHẢI > 0
    so_tien_chi: float = Field(..., gt=0, description="Số tiền chi phải lớn hơn 0")
    noi_dung: Optional[str] = None
    ma_phi: Optional[str] = None
    phieu_chi_id: Optional[int] = None
    period_id: int

# TÌM class BankPaymentTransactionResponse và THAY TOÀN BỘ:
class BankPaymentTransactionResponse(BaseModel):
    id: int
    so_chung_tu: str
    ngay_chung_tu: date
    loai_giao_dich: str
    so_tien_chi: float
    noi_dung: Optional[str] = None
    ma_phi: Optional[str] = None
    da_doi_chieu: bool
    trang_thai: str
    tk_id: Optional[int] = None        # ✅ THÊM
    ten_tk: Optional[str] = None       # ✅ THÊM
    ma_tk: Optional[str] = None        # ✅ THÊM


class BankBalanceReportRow(BaseModel):
    ma_tk: str
    ten_tk: str
    loai_tk: str
    so_du_dau_ky: float
    tong_thu: float
    tong_chi: float
    so_du_cuoi_ky: float

class BankBalanceReport(BaseModel):
    period_name: str
    report_date: str
    rows: list[BankBalanceReportRow]
    tong_du_dau_ky: float
    tong_thu_all: float
    tong_chi_all: float
    tong_du_cuoi_ky: float


class DropdownItem(BaseModel):
    value: str
    label: str

class LoaiGiaoDichThuResponse(BaseModel):
    items: list[DropdownItem]

class LoaiGiaoDichChiResponse(BaseModel):
    items: list[DropdownItem]