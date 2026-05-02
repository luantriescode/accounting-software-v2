"""
Routes cho module Warehouse - PNK, PXK, Chi phí, Tồn kho
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.modules.warehouse.models import (
    CostItem, WarehouseReceipt, WarehouseReceiptItem, WarehouseReceiptCost,
    WarehouseIssue, WarehouseIssueItem, StockSummary
)
from app.modules.warehouse.schemas import (
    PhieuNhapKhoCreate, PhieuNhapKhoResponse,
    PhieuXuatKhoCreate, PhieuXuatKhoResponse,
    CostItemResponse, WarehouseReceiptItemResponse, WarehouseIssueItemResponse,
    StockSummaryResponse
)

router = APIRouter(tags=["Kho Hàng | Warehouse"])


# ============ CHI PHÍ MUA HÀNG ============
@router.get("/cost-items", response_model=list[CostItemResponse])
def get_cost_items(db: Session = Depends(get_db)):
    items = db.query(CostItem).filter(CostItem.con_hoat_dong == True).all()
    return [CostItemResponse(id=i.id, ma_chi_phi=i.ma_chi_phi, ten_chi_phi=i.ten_chi_phi, tinh_chat=i.tinh_chat) for i in items]


# ============ PHIẾU NHẬP KHO ============
@router.post("/documents/phieu-nhap-kho", response_model=PhieuNhapKhoResponse, status_code=201)
def create_phieu_nhap_kho(data: PhieuNhapKhoCreate, db: Session = Depends(get_db)):
    # Kiểm tra số phiếu không trùng
    if db.query(WarehouseReceipt).filter(
        WarehouseReceipt.so_phieu_nhap == data.so_phieu_nhap,
        WarehouseReceipt.period_id == data.ky_ke_toan_id
    ).first():
        raise HTTPException(400, "Số phiếu nhập đã tồn tại trong kỳ này")
    
    # Tính tổng
    tong_so_luong = sum(item.quantity for item in data.items)
    tong_tien = sum(item.quantity * item.unit_price for item in data.items)
    
    # Tạo phiếu nhập kho
    pnk = WarehouseReceipt(
        loai_phieu_nhap="Nhập từ NCC",
        so_phieu_nhap=data.so_phieu_nhap,
        ngay_phieu_nhap=data.ngay_phieu_nhap,
        nha_cung_cap_id=data.nha_cung_cap_id,
        dia_chi=data.dia_chi,
        nguoi_giao_dich=data.nguoi_giao_dich,
        dien_giai=data.dien_giai,
        period_id=data.ky_ke_toan_id,
        tong_tien=tong_tien,
        tong_so_luong=tong_so_luong,
        trang_thai="DRAFT"
    )
    db.add(pnk)
    db.flush()
    
    # Thêm chi tiết hàng nhập
    for item in data.items:
        pnk_item = WarehouseReceiptItem(
            receipt_id=pnk.id,
            product_id=item.product_id,
            warehouse_id=item.warehouse_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            current_stock=0
        )
        db.add(pnk_item)
    
    # Thêm chi phí nếu có
    if data.costs:
        for cost in data.costs:
            cost_item = WarehouseReceiptCost(
                receipt_id=pnk.id,
                cost_item_id=cost.cost_item_id,
                ngay_phieu_nhap=data.ngay_phieu_nhap,
                so_phieu_nhap=data.so_phieu_nhap,
                supplier_id=data.nha_cung_cap_id,
                tong_chi_phi=cost.tong_chi_phi,
                so_phan_bo_lan_nay=cost.so_phan_bo_lan_nay
            )
            db.add(cost_item)
    
    db.commit()
    db.refresh(pnk)
    
    return PhieuNhapKhoResponse(
        id=pnk.id,
        so_phieu_nhap=pnk.so_phieu_nhap,
        ngay_phieu_nhap=pnk.ngay_phieu_nhap,
        nha_cung_cap_id=pnk.nha_cung_cap_id,
        tong_so_luong=pnk.tong_so_luong,
        tong_tien=float(pnk.tong_tien),
        trang_thai=pnk.trang_thai
    )

@router.get("/documents/phieu-nhap-kho", response_model=list[PhieuNhapKhoResponse])
def get_phieu_nhap_kho(db: Session = Depends(get_db)):
    pnks = db.query(WarehouseReceipt).all()
    return [
        PhieuNhapKhoResponse(
            id=p.id,
            so_phieu_nhap=p.so_phieu_nhap,
            ngay_phieu_nhap=p.ngay_phieu_nhap,
            nha_cung_cap_id=p.nha_cung_cap_id,
            tong_so_luong=p.tong_so_luong,
            tong_tien=float(p.tong_tien),
            trang_thai=p.trang_thai
        ) for p in pnks
    ]

@router.get("/documents/phieu-nhap-kho/{id}", response_model=PhieuNhapKhoResponse)
def get_phieu_nhap_kho_detail(id: int, db: Session = Depends(get_db)):
    pnk = db.query(WarehouseReceipt).filter(WarehouseReceipt.id == id).first()
    if not pnk:
        raise HTTPException(404, "Phiếu nhập kho không tìm thấy")
    return PhieuNhapKhoResponse(
        id=pnk.id,
        so_phieu_nhap=pnk.so_phieu_nhap,
        ngay_phieu_nhap=pnk.ngay_phieu_nhap,
        nha_cung_cap_id=pnk.nha_cung_cap_id,
        tong_so_luong=pnk.tong_so_luong,
        tong_tien=float(pnk.tong_tien),
        trang_thai=pnk.trang_thai
    )


# ============ PHIẾU XUẤT KHO ============
@router.post("/documents/phieu-xuat-kho", response_model=PhieuXuatKhoResponse, status_code=201)
def create_phieu_xuat_kho(data: PhieuXuatKhoCreate, db: Session = Depends(get_db)):
    # Kiểm tra số phiếu không trùng
    if db.query(WarehouseIssue).filter(
        WarehouseIssue.so_phieu_xuat == data.so_phieu_xuat,
        WarehouseIssue.period_id == data.ky_ke_toan_id
    ).first():
        raise HTTPException(400, "Số phiếu xuất đã tồn tại trong kỳ này")
    
    # Tính tổng
    tong_so_luong = sum(item.quantity for item in data.items)
    tong_tien = sum(item.quantity * item.unit_price for item in data.items)
    
    # Tạo phiếu xuất kho
    pxk = WarehouseIssue(
        loai_phieu_xuat="Xuất bán",
        so_phieu_xuat=data.so_phieu_xuat,
        ngay_phieu_xuat=data.ngay_phieu_xuat,
        khach_hang_id=data.khach_hang_id,
        dia_chi=data.dia_chi,
        nguoi_giao_dich=data.nguoi_giao_dich,
        dien_giai=data.dien_giai,
        period_id=data.ky_ke_toan_id,
        tong_tien=tong_tien,
        tong_so_luong=tong_so_luong,
        trang_thai="DRAFT"
    )
    db.add(pxk)
    db.flush()
    
    # Thêm chi tiết hàng xuất
    for item in data.items:
        pxk_item = WarehouseIssueItem(
            issue_id=pxk.id,
            product_id=item.product_id,
            warehouse_id=item.warehouse_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            current_stock=0
        )
        db.add(pxk_item)
    
    db.commit()
    db.refresh(pxk)
    
    return PhieuXuatKhoResponse(
        id=pxk.id,
        so_phieu_xuat=pxk.so_phieu_xuat,
        ngay_phieu_xuat=pxk.ngay_phieu_xuat,
        khach_hang_id=pxk.khach_hang_id,
        tong_so_luong=pxk.tong_so_luong,
        tong_tien=float(pxk.tong_tien),
        trang_thai=pxk.trang_thai
    )

@router.get("/documents/phieu-xuat-kho", response_model=list[PhieuXuatKhoResponse])
def get_phieu_xuat_kho(db: Session = Depends(get_db)):
    pxks = db.query(WarehouseIssue).all()
    return [
        PhieuXuatKhoResponse(
            id=p.id,
            so_phieu_xuat=p.so_phieu_xuat,
            ngay_phieu_xuat=p.ngay_phieu_xuat,
            khach_hang_id=p.khach_hang_id,
            tong_so_luong=p.tong_so_luong,
            tong_tien=float(p.tong_tien),
            trang_thai=p.trang_thai
        ) for p in pxks
    ]

@router.get("/documents/phieu-xuat-kho/{id}", response_model=PhieuXuatKhoResponse)
def get_phieu_xuat_kho_detail(id: int, db: Session = Depends(get_db)):
    pxk = db.query(WarehouseIssue).filter(WarehouseIssue.id == id).first()
    if not pxk:
        raise HTTPException(404, "Phiếu xuất kho không tìm thấy")
    return PhieuXuatKhoResponse(
        id=pxk.id,
        so_phieu_xuat=pxk.so_phieu_xuat,
        ngay_phieu_xuat=pxk.ngay_phieu_xuat,
        khach_hang_id=pxk.khach_hang_id,
        tong_so_luong=pxk.tong_so_luong,
        tong_tien=float(pxk.tong_tien),
        trang_thai=pxk.trang_thai
    )


# ============ TỒN KHO ============
@router.get("/stock-summary", response_model=list[StockSummaryResponse])
def get_stock_summary(period_id: int, db: Session = Depends(get_db)):
    summaries = db.query(StockSummary).filter(StockSummary.period_id == period_id).all()
    return [
        StockSummaryResponse(
            id=s.id,
            product_id=s.product_id,
            warehouse_id=s.warehouse_id,
            period_id=s.period_id,
            ton_dau_ky_sl=s.ton_dau_ky_sl,
            ton_dau_ky_gia_tri=float(s.ton_dau_ky_gia_tri or 0),
            nhap_trong_ky_sl=s.nhap_trong_ky_sl,
            nhap_trong_ky_gia_tri=float(s.nhap_trong_ky_gia_tri or 0),
            xuat_trong_ky_sl=s.xuat_trong_ky_sl,
            xuat_trong_ky_gia_tri=float(s.xuat_trong_ky_gia_tri or 0),
            ton_cuoi_ky_sl=s.ton_cuoi_ky_sl,
            ton_cuoi_ky_gia_tri=float(s.ton_cuoi_ky_gia_tri or 0)
        ) for s in summaries
    ]

@router.post("/stock-summary", summary="Lưu số dư đầu kỳ tồn kho", status_code=201)
def upsert_stock_summary(data: dict, db: Session = Depends(get_db)):
    """Tạo mới hoặc cập nhật số dư đầu kỳ tồn kho"""
    existing = db.query(StockSummary).filter(
        StockSummary.product_id   == data.get("product_id"),
        StockSummary.warehouse_id == data.get("warehouse_id"),
        StockSummary.period_id    == data.get("period_id", 1),
    ).first()

    if existing:
        existing.ton_dau_ky_sl         = data.get("ton_dau_ky_sl", 0)
        existing.ton_dau_ky_gia_tri     = data.get("ton_dau_ky_gia_tri", 0)
        existing.ton_cuoi_ky_sl        = data.get("ton_dau_ky_sl", 0)
        existing.ton_cuoi_ky_gia_tri    = data.get("ton_dau_ky_gia_tri", 0)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        row = StockSummary(
            product_id            = data.get("product_id"),
            warehouse_id          = data.get("warehouse_id"),
            period_id             = data.get("period_id", 1),
            ton_dau_ky_sl         = data.get("ton_dau_ky_sl", 0),
            ton_dau_ky_gia_tri    = data.get("ton_dau_ky_gia_tri", 0),
            nhap_trong_ky_sl      = 0,
            nhap_trong_ky_gia_tri = 0,
            xuat_trong_ky_sl      = 0,
            xuat_trong_ky_gia_tri = 0,
            ton_cuoi_ky_sl        = data.get("ton_dau_ky_sl", 0),
            ton_cuoi_ky_gia_tri   = data.get("ton_dau_ky_gia_tri", 0),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row