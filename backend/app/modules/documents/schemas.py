"""
Schemas cho module Documents (PT, PC, BC, BN, PNM, PBH, BL)
FIX: Đổi field names sang tiếng Việt để match với frontend
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# ============ PHIẾU THU (PT) ============
class PhieuThuCreate(BaseModel):
    SoCT: str
    NgayCT: date
    MaKH: int
    MaKyKeToan: int
    TienThu: float
    HinhThucTT: str = "Chuyển khoản"
    LoaiGiaoDich: Optional[str] = None
    DienGiai: Optional[str] = None

class PhieuThuResponse(BaseModel):
    id: int
    SoCT: str
    NgayCT: date
    MaKH: Optional[int] = None
    TienThu: float
    HinhThucTT: str
    DienGiai: Optional[str] = None
    TrangThai: str = "DRAFT"


# ============ PHIẾU CHI (PC) ============
class PhieuChiCreate(BaseModel):
    SoCT: str
    NgayCT: date
    MaNCC: Optional[int] = None
    MaKyKeToan: int
    TienChi: float
    HinhThucTT: str = "Chuyển khoản"
    LoaiGiaoDich: Optional[str] = None
    DienGiai: Optional[str] = None

class PhieuChiResponse(BaseModel):
    id: int
    SoCT: str
    NgayCT: date
    TienChi: float
    HinhThucTT: str
    DienGiai: Optional[str] = None
    TrangThai: str = "DRAFT"


# ============ BÁO CÓ (BC) ============
class BaoCoCreate(BaseModel):
    SoCT: str
    NgayCT: date
    MaKH: int
    MaKyKeToan: int
    SoTien: float
    DienGiai: Optional[str] = None

class BaoCoResponse(BaseModel):
    id: int
    SoCT: str
    NgayCT: date
    SoTien: float
    TrangThai: str = "DRAFT"


# ============ BÁO NỢ (BN) ============
class BaoNoCreate(BaseModel):
    SoCT: str
    NgayCT: date
    MaNCC: int
    MaKyKeToan: int
    SoTien: float
    DienGiai: Optional[str] = None

class BaoNoResponse(BaseModel):
    id: int
    SoCT: str
    NgayCT: date
    SoTien: float
    TrangThai: str = "DRAFT"


# ============ PHIẾU NHẬP MUA (PNM) ============
class PhieuNhapMuaItemCreate(BaseModel):
    MaHH: int
    SoLuong: int
    DonGia: float
    GhiChu: Optional[str] = None

class PhieuNhapMuaCreate(BaseModel):
    SoCT: str
    NgayCT: date
    MaNCC: int
    MaKyKeToan: int
    SoHD: Optional[str] = None
    NgayHD: Optional[date] = None
    NguoiGD: Optional[str] = None
    DienGiai: Optional[str] = None
    HinhThucTT: Optional[str] = None
    DanhSachHang: list[PhieuNhapMuaItemCreate]

class PhieuNhapMuaResponse(BaseModel):
    id: int
    SoCT: str
    NgayCT: date
    MaNCC: Optional[int] = None
    TongTien: float
    TrangThai: str = "DRAFT"


# ============ PHIẾU BÁN HÀNG (PBH) ============
class PhieuBanHangItemCreate(BaseModel):
    MaHH: int
    SoLuong: int
    DonGia: float
    GhiChu: Optional[str] = None

class PhieuBanHangCreate(BaseModel):
    SoCT: str
    NgayCT: date
    MaKH: int
    MaKyKeToan: int
    SoHD: Optional[str] = None
    NgayHD: Optional[date] = None
    NguoiGD: Optional[str] = None
    DienGiai: Optional[str] = None
    HinhThucTT: Optional[str] = None
    DanhSachHang: list[PhieuBanHangItemCreate]

class PhieuBanHangResponse(BaseModel):
    id: int
    SoCT: str
    NgayCT: date
    MaKH: Optional[int] = None
    TongTien: float
    TrangThai: str = "DRAFT"


# ============ PHIẾU BÁN LẺ (BL) ============
class PhieuBanLeItemCreate(BaseModel):
    MaHH: int
    SoLuong: int
    DonGia: float

class PhieuBanLeCreate(BaseModel):
    SoCT: str
    NgayCT: date
    MaKyKeToan: int
    KhachHang: Optional[str] = None
    DienGiai: Optional[str] = None
    DanhSachHang: list[PhieuBanLeItemCreate]

class PhieuBanLeResponse(BaseModel):
    id: int
    SoCT: str
    NgayCT: date
    KhachHang: Optional[str] = None
    TongTien: float
    TrangThai: str = "DRAFT"


# ============ GHI SỔ ============
class GhiSoRequest(BaseModel):
    document_id: int

class HuyGhiSoRequest(BaseModel):
    document_id: int