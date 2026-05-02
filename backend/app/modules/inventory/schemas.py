"""
Schemas cho module Inventory - HTK
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date


# ============ FILTER REQUEST ============
class InventoryValuationRequest(BaseModel):
    period_from: date
    period_to: date
    warehouse_id: Optional[int] = None
    product_id: Optional[int] = None
    valuation_method: str = "AVG"  # AVG hoặc FIFO
    group_by: str = "product"  # product, warehouse, hoặc both


# ============ CALCULATION RESPONSE ============
class InventoryValuationDetailResponse(BaseModel):
    product_id: int
    product_code: str
    product_name: str
    warehouse_id: int
    warehouse_name: str
    
    # Tồn đầu kỳ
    opening_qty: float
    opening_value: float
    
    # Nhập trong kỳ
    import_qty: float
    import_value: float
    
    # Xuất trong kỳ
    export_qty: float
    export_value: float
    
    # Tồn cuối kỳ
    closing_qty: float
    closing_value: float
    
    # Đơn giá
    unit_price: float
    valuation_method: str


class InventoryValuationResponse(BaseModel):
    period_from: date
    period_to: date
    valuation_method: str
    total_opening_qty: float
    total_opening_value: float
    total_import_qty: float
    total_import_value: float
    total_export_qty: float
    total_export_value: float
    total_closing_qty: float
    total_closing_value: float
    details: list[InventoryValuationDetailResponse]


# ============ REPORT RESPONSE ============
class InventoryReportRow(BaseModel):
    product_code: str
    product_name: str
    warehouse_name: str
    unit: str
    
    ton_dau_ky_sl: float
    ton_dau_ky_gia_tri: float
    
    nhap_trong_ky_sl: float
    nhap_trong_ky_gia_tri: float
    
    xuat_trong_ky_sl: float
    xuat_trong_ky_gia_tri: float
    
    ton_cuoi_ky_sl: float
    ton_cuoi_ky_gia_tri: float
    
    don_gia: float


class InventoryReport(BaseModel):
    report_title: str
    period_from: date
    period_to: date
    valuation_method: str
    generated_at: str
    rows: list[InventoryReportRow]
    
    # Tổng cộng
    total_opening_qty: float
    total_opening_value: float
    total_import_qty: float
    total_import_value: float
    total_export_qty: float
    total_export_value: float
    total_closing_qty: float
    total_closing_value: float