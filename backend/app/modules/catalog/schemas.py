"""Schemas cho module Catalog"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# ============ CUSTOMER ============
class CustomerCreate(BaseModel):
    MaKH: str
    TenKH: str
    DiaChi: Optional[str] = None
    SDT: Optional[str] = None
    Email: Optional[str] = None
    MST: Optional[str] = None
    HanMucTinDung: float = 0
    ConHoatDong: bool = True

class CustomerUpdate(BaseModel):
    TenKH: Optional[str] = None
    DiaChi: Optional[str] = None
    SDT: Optional[str] = None
    Email: Optional[str] = None
    MST: Optional[str] = None
    HanMucTinDung: Optional[float] = None
    ConHoatDong: Optional[bool] = None

class CustomerResponse(BaseModel):
    id: int
    MaKH: str
    TenKH: str
    DiaChi: Optional[str] = None
    SDT: Optional[str] = None
    Email: Optional[str] = None
    MST: Optional[str] = None
    HanMucTinDung: float
    ConHoatDong: bool


# ============ SUPPLIER ============
class SupplierCreate(BaseModel):
    MaNCC: str
    TenNCC: str
    DiaChi: Optional[str] = None
    SDT: Optional[str] = None
    Email: Optional[str] = None
    MST: Optional[str] = None
    HanThanhToan: int = 30
    ConHoatDong: bool = True

class SupplierUpdate(BaseModel):
    TenNCC: Optional[str] = None
    DiaChi: Optional[str] = None
    SDT: Optional[str] = None
    Email: Optional[str] = None
    MST: Optional[str] = None
    HanThanhToan: Optional[int] = None
    ConHoatDong: Optional[bool] = None

class SupplierResponse(BaseModel):
    id: int
    MaNCC: str
    TenNCC: str
    DiaChi: Optional[str] = None
    SDT: Optional[str] = None
    Email: Optional[str] = None
    MST: Optional[str] = None
    HanThanhToan: int
    ConHoatDong: bool


# ============ PRODUCT ============
class ProductCreate(BaseModel):
    MaHH: str
    TenHH: str
    DVT: Optional[str] = None
    DanhMuc: Optional[str] = None
    GiaBan: Optional[float] = None
    TonKhoToiThieu: int = 10
    ConHoatDong: bool = True

class ProductUpdate(BaseModel):
    TenHH: Optional[str] = None
    DVT: Optional[str] = None
    DanhMuc: Optional[str] = None
    GiaBan: Optional[float] = None
    TonKhoToiThieu: Optional[int] = None
    ConHoatDong: Optional[bool] = None

class ProductResponse(BaseModel):
    id: int
    MaHH: str
    TenHH: str
    DVT: Optional[str] = None
    DanhMuc: Optional[str] = None
    GiaBan: Optional[float] = None
    TonKhoToiThieu: int
    ConHoatDong: bool


# ============ WAREHOUSE ============
class WarehouseCreate(BaseModel):
    MaKho: str
    TenKho: str
    DiaChi: Optional[str] = None
    NguoiQuanLy: Optional[str] = None
    ConHoatDong: bool = True

class WarehouseResponse(BaseModel):
    id: int
    MaKho: str
    TenKho: str
    DiaChi: Optional[str] = None
    NguoiQuanLy: Optional[str] = None
    ConHoatDong: bool


# ============ FISCAL PERIOD ============
class FiscalPeriodResponse(BaseModel):
    id: int
    MaKy: str
    TenKy: str
    NgayBatDau: date
    NgayKetThuc: date
    DaDong: bool