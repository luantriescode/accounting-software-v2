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
    print(f"DEBUG create_phieu_nhap_kho items: {[(i.product_id, i.chi_phi_phan_bo) for i in data.items]}")
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
        pnm_id=data.pnm_id,
        # Tính tổng — bao gồm CPMH
        tong_so_luong = sum(item.quantity for item in data.items),
        tong_tien = sum(item.quantity * item.unit_price + (item.chi_phi_phan_bo or 0) for item in data.items),
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
            chi_phi_phan_bo=item.chi_phi_phan_bo or 0,
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
        loai_phieu_nhap=pnk.loai_phieu_nhap,
        tong_so_luong=pnk.tong_so_luong,
        tong_tien=float(pnk.tong_tien),
        trang_thai=pnk.trang_thai,
        pnm_id=pnk.pnm_id
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
            loai_phieu_nhap=p.loai_phieu_nhap or "",
            tong_so_luong=p.tong_so_luong,
            tong_tien=float(p.tong_tien or 0),
            trang_thai=p.trang_thai,
            pnm_id=p.pnm_id,
            updated_from_pnm_at=str(p.updated_from_pnm_at) if p.updated_from_pnm_at else None
        ) for p in pnks
    ]


@router.get("/documents/phieu-nhap-kho/{doc_id}")
def get_phieu_nhap_kho_detail(doc_id: int, db: Session = Depends(get_db)):
    pnk = db.query(WarehouseReceipt).filter(
        WarehouseReceipt.id == doc_id
    ).first()
    if not pnk:
        raise HTTPException(404, "Không tìm thấy phiếu nhập kho")

    # Query items - dùng receipt_id
    items = db.query(WarehouseReceiptItem).filter(
        WarehouseReceiptItem.receipt_id == pnk.id
    ).all()

    # Query NCC
    supplier = None
    if pnk.nha_cung_cap_id:
        from app.modules.catalog.models import Supplier
        supplier = db.query(Supplier).filter(
            Supplier.id == pnk.nha_cung_cap_id
        ).first()

    return {
        "id": pnk.id,
        "SoCT": pnk.so_phieu_nhap,
        "so_phieu_nhap": pnk.so_phieu_nhap,
        "NgayCT": str(pnk.ngay_phieu_nhap),
        "ngay_phieu_nhap": str(pnk.ngay_phieu_nhap),
        "loai_phieu_nhap": pnk.loai_phieu_nhap or "",
        "MaNCC": pnk.nha_cung_cap_id,
        "nha_cung_cap_id": pnk.nha_cung_cap_id,
        "ten_ncc": supplier.name if supplier else "",
        "nguoi_giao_dich": pnk.nguoi_giao_dich or "",
        "dien_giai": pnk.dien_giai or "",
        "TongTien": float(pnk.tong_tien or 0),
        "tong_tien": float(pnk.tong_tien or 0),
        "tong_so_luong": pnk.tong_so_luong or 0,
        "TrangThai": pnk.trang_thai or "DRAFT",
        "trang_thai": pnk.trang_thai or "DRAFT",
        "pnm_id": pnk.pnm_id,
        "updated_from_pnm_at": str(pnk.updated_from_pnm_at) if pnk.updated_from_pnm_at else None,
        "items": [
            {
                "product_id": i.product_id,
                "warehouse_id": i.warehouse_id,
                "quantity": int(i.quantity),
                "unit_price": float(i.unit_price),
                "chi_phi_phan_bo": float(i.chi_phi_phan_bo or 0),
                "total": float(i.quantity * i.unit_price) + float(i.chi_phi_phan_bo or 0)
            } for i in items
        ]
    }
@router.put("/documents/phieu-nhap-kho/{pnk_id}")
def update_phieu_nhap_kho(pnk_id: int, data: PhieuNhapKhoCreate, db: Session = Depends(get_db)):
    from datetime import datetime
    pnk = db.query(WarehouseReceipt).filter(WarehouseReceipt.id == pnk_id).first()
    if not pnk:
        raise HTTPException(404, "Không tìm thấy PNK")

    # Cập nhật header
    pnk.ngay_phieu_nhap = data.ngay_phieu_nhap
    pnk.loai_phieu_nhap = data.loai_phieu_nhap or pnk.loai_phieu_nhap
    pnk.nha_cung_cap_id = data.nha_cung_cap_id
    pnk.nguoi_giao_dich = data.nguoi_giao_dich
    pnk.dien_giai = data.dien_giai
    pnk.period_id = data.ky_ke_toan_id
    if data.pnm_id:
        pnk.updated_from_pnm_at = datetime.now()

    # Xóa items cũ
    db.query(WarehouseReceiptItem).filter(
        WarehouseReceiptItem.receipt_id == pnk_id
    ).delete()

    # Insert items mới
    tong_tien = 0
    tong_so_luong = 0
    for item in data.items:
        tt = item.quantity * item.unit_price + (item.chi_phi_phan_bo or 0)
        tong_tien += tt
        tong_so_luong += item.quantity
        pnk_item = WarehouseReceiptItem(
            receipt_id=pnk_id,
            product_id=item.product_id,
            warehouse_id=item.warehouse_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            chi_phi_phan_bo=item.chi_phi_phan_bo or 0,
            current_stock=0
        )
        db.add(pnk_item)

    pnk.tong_tien = tong_tien
    pnk.tong_so_luong = tong_so_luong
    db.commit()
    return {"message": "Cập nhật PNK thành công", "id": pnk_id}

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
        loai_phieu_xuat=data.loai_phieu_xuat or "Xuất bán",
        so_phieu_xuat=data.so_phieu_xuat,
        ngay_phieu_xuat=data.ngay_phieu_xuat,
        khach_hang_id=data.khach_hang_id,
        ten_khach_le=data.ten_khach_le,             # ✅ THÊM
        dia_chi=data.dia_chi,
        nguoi_giao_dich=data.nguoi_giao_dich,
        dien_giai=data.dien_giai,
        period_id=data.ky_ke_toan_id,
        pbh_id=data.pbh_id,
        bl_id=data.bl_id,
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
@router.get("/documents/phieu-xuat-kho/{pxk_id}")
def get_phieu_xuat_kho_detail(pxk_id: int, db: Session = Depends(get_db)):
    p = db.query(WarehouseIssue).filter(WarehouseIssue.id == pxk_id).first()
    if not p:
        raise HTTPException(404, "Không tìm thấy PXK")
    items = db.query(WarehouseIssueItem).filter(WarehouseIssueItem.issue_id == pxk_id).all()
    khach_hang_ten = None
    if p.khach_hang_id:
        from app.modules.catalog.models import Customer
        kh = db.query(Customer).filter(Customer.id == p.khach_hang_id).first()
        khach_hang_ten = kh.name if kh else None
    return {
        "id": p.id,
        "so_phieu_xuat": p.so_phieu_xuat,
        "ngay_phieu_xuat": str(p.ngay_phieu_xuat),
        "loai_phieu_xuat": p.loai_phieu_xuat or "",
        "khach_hang_id": p.khach_hang_id,
        "khach_hang_ten": khach_hang_ten,
        "ten_khach_le": p.ten_khach_le or "",
        "nguoi_giao_dich": p.nguoi_giao_dich or "",
        "dien_giai": p.dien_giai or "",
        "tong_tien": float(p.tong_tien or 0),
        "trang_thai": p.trang_thai or "DRAFT",
        "pbh_id": p.pbh_id,
        "bl_id": p.bl_id,
        "items": [
            {
                "product_id": i.product_id,
                "warehouse_id": i.warehouse_id,
                "quantity": i.quantity,
                "unit_price": float(i.unit_price),
                "total": float(i.quantity * i.unit_price)
            } for i in items
        ]
    }

@router.get("/documents/phieu-xuat-kho", response_model=list[PhieuXuatKhoResponse])
def get_phieu_xuat_kho(db: Session = Depends(get_db)):
    pxks = db.query(WarehouseIssue).all()
    return [
        PhieuXuatKhoResponse(
            id=p.id,
            so_phieu_xuat=p.so_phieu_xuat,
            ngay_phieu_xuat=p.ngay_phieu_xuat,
            loai_phieu_xuat=p.loai_phieu_xuat or "",
            khach_hang_id=p.khach_hang_id,
            ten_khach_le=p.ten_khach_le or "",      # ✅ THÊM
            nguoi_giao_dich=p.nguoi_giao_dich or "", # ✅ THÊM
            tong_so_luong=p.tong_so_luong,
            tong_tien=float(p.tong_tien or 0),
            trang_thai=p.trang_thai or "DRAFT",
            pbh_id=p.pbh_id,
            bl_id=p.bl_id
            
        ) for p in pxks
    ]


@router.get("/documents/phieu-xuat-kho/{doc_id}")
def get_phieu_xuat_kho_detail(doc_id: int, db: Session = Depends(get_db)):
    pxk = db.query(WarehouseIssue).filter(
        WarehouseIssue.id == doc_id
    ).first()
    if not pxk:
        raise HTTPException(404, "Không tìm thấy phiếu xuất kho")

    items = db.query(WarehouseIssueItem).filter(
        WarehouseIssueItem.issue_id == pxk.id
    ).all()

    customer = None
    if pxk.khach_hang_id:
        from app.modules.catalog.models import Customer
        customer = db.query(Customer).filter(
            Customer.id == pxk.khach_hang_id
        ).first()

    return {
        "id": pxk.id,
        "SoCT": pxk.so_phieu_xuat,
        "so_phieu_xuat": pxk.so_phieu_xuat,
        "NgayCT": str(pxk.ngay_phieu_xuat),
        "ngay_phieu_xuat": str(pxk.ngay_phieu_xuat),
        "loai_phieu_xuat": pxk.loai_phieu_xuat or "",
        "MaKH": pxk.khach_hang_id,
        "khach_hang_id": pxk.khach_hang_id,
        "ten_kh": customer.name if customer else "",
        "nguoi_giao_dich": pxk.nguoi_giao_dich or "",
        "dien_giai": pxk.dien_giai or "",
        "TongTien": float(pxk.tong_tien or 0),
        "tong_tien": float(pxk.tong_tien or 0),
        "tong_so_luong": pxk.tong_so_luong or 0,
        "TrangThai": pxk.trang_thai or "DRAFT",
        "trang_thai": pxk.trang_thai or "DRAFT",
        "items": [
            {
                "product_id": i.product_id,
                "warehouse_id": i.warehouse_id,
                "quantity": int(i.quantity),
                "unit_price": float(i.unit_price),
                "total": float(i.quantity * i.unit_price)
            } for i in items
        ]
    }
@router.put("/documents/phieu-xuat-kho/{pxk_id}")
def update_phieu_xuat_kho(pxk_id: int, data: PhieuXuatKhoCreate, db: Session = Depends(get_db)):
    pxk = db.query(WarehouseIssue).filter(WarehouseIssue.id == pxk_id).first()
    if not pxk:
        raise HTTPException(404, "Không tìm thấy PXK")

    # Cập nhật header
    pxk.ngay_phieu_xuat = data.ngay_phieu_xuat
    pxk.loai_phieu_xuat = data.loai_phieu_xuat or pxk.loai_phieu_xuat
    pxk.khach_hang_id = data.khach_hang_id
    pxk.nguoi_giao_dich = data.nguoi_giao_dich
    pxk.dien_giai = data.dien_giai
    pxk.period_id = data.ky_ke_toan_id
    pxk.pbh_id = data.pbh_id
    pxk.bl_id = data.bl_id

    # Xóa items cũ
    db.query(WarehouseIssueItem).filter(
        WarehouseIssueItem.issue_id == pxk_id
    ).delete()

    # Insert items mới
    tong_tien = 0
    tong_so_luong = 0
    for item in data.items:
        tt = item.quantity * item.unit_price
        tong_tien += tt
        tong_so_luong += item.quantity
        pxk_item = WarehouseIssueItem(
            issue_id=pxk_id,
            product_id=item.product_id,
            warehouse_id=item.warehouse_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            current_stock=0
        )
        db.add(pxk_item)

    pxk.tong_tien = tong_tien
    pxk.tong_so_luong = tong_so_luong
    db.commit()
    return {"message": "Cập nhật PXK thành công", "id": pxk_id}

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