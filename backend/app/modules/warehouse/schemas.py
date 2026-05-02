"""
Schemas cho module Warehouse - PNK, PXK, Chi phí, Tồn kho
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date


# ============ COST ITEM ============
class CostItemCreate(BaseModel):
    ma_chi_phi: str
    ten_chi_phi: str
    tinh_chat: str = "dich_vu"
    phan_bo_theo: Optional[str] = None

class CostItemResponse(BaseModel):
    id: int
    ma_chi_phi: str
    ten_chi_phi: str
    tinh_chat: str


# ============ WAREHOUSE RECEIPT ITEM ============
class WarehouseReceiptItemCreate(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int
    unit_price: float

class WarehouseReceiptItemResponse(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    quantity: int
    unit_price: float
    total_amount: float


# ============ WAREHOUSE RECEIPT COST ============
class WarehouseReceiptCostCreate(BaseModel):
    cost_item_id: int
    tong_chi_phi: float
    so_phan_bo_lan_nay: float

class WarehouseReceiptCostResponse(BaseModel):
    id: int
    cost_item_id: int
    tong_chi_phi: float
    so_phan_bo_lan_nay: float


# ============ PHIẾU NHẬP KHO (PNK) ============
class PhieuNhapKhoCreate(BaseModel):
    so_phieu_nhap: str
    ngay_phieu_nhap: date
    nha_cung_cap_id: int
    ky_ke_toan_id: int
    dia_chi: Optional[str] = None
    nguoi_giao_dich: Optional[str] = None
    dien_giai: Optional[str] = None
    items: list[WarehouseReceiptItemCreate]
    costs: Optional[list[WarehouseReceiptCostCreate]] = None

class PhieuNhapKhoResponse(BaseModel):
    id: int
    so_phieu_nhap: str
    ngay_phieu_nhap: date
    nha_cung_cap_id: Optional[int] = None
    tong_so_luong: int
    tong_tien: float
    trang_thai: str


# ============ WAREHOUSE ISSUE ITEM ============
class WarehouseIssueItemCreate(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int
    unit_price: float

class WarehouseIssueItemResponse(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    quantity: int
    unit_price: float
    total_amount: float


# ============ PHIẾU XUẤT KHO (PXK) ============
class PhieuXuatKhoCreate(BaseModel):
    so_phieu_xuat: str
    ngay_phieu_xuat: date
    khach_hang_id: Optional[int] = None
    ky_ke_toan_id: int
    dia_chi: Optional[str] = None
    nguoi_giao_dich: Optional[str] = None
    dien_giai: Optional[str] = None
    items: list[WarehouseIssueItemCreate]

class PhieuXuatKhoResponse(BaseModel):
    id: int
    so_phieu_xuat: str
    ngay_phieu_xuat: date
    khach_hang_id: Optional[int] = None
    tong_so_luong: int
    tong_tien: float
    trang_thai: str


# ============ STOCK SUMMARY ============
class StockSummaryResponse(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    period_id: int
    ton_dau_ky_sl: int
    ton_dau_ky_gia_tri: float
    nhap_trong_ky_sl: int
    nhap_trong_ky_gia_tri: float
    xuat_trong_ky_sl: int
    xuat_trong_ky_gia_tri: float
    ton_cuoi_ky_sl: int
    ton_cuoi_ky_gia_tri: float