"""
Routes cho module Documents - PT, PC, BC, BN, PNM, PBH, BL
FIX: Cập nhật để dùng field names mới (tiếng Việt) match frontend
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
import json
from app.modules.documents.models import (
    Document, Receipt, Payment, BankStatement,
    SalesOrder, RetailOrder, PurchaseOrderItem, SalesOrderItem, RetailOrderItem
)
from app.modules.documents.schemas import (
    PhieuThuCreate, PhieuThuResponse,
    PhieuChiCreate, PhieuChiResponse,
    BaoCoCreate, BaoCoResponse,
    BaoNoCreate, BaoNoResponse,
    PhieuNhapMuaCreate, PhieuNhapMuaResponse,
    PhieuBanHangCreate, PhieuBanHangResponse,
    PhieuBanLeCreate, PhieuBanLeResponse
)

router = APIRouter(tags=["Chứng Từ | Documents"])


# ============ PHIẾU THU ============
@router.post("/documents/phieu-thu", response_model=PhieuThuResponse, status_code=201)
def create_phieu_thu(data: PhieuThuCreate, db: Session = Depends(get_db)):
    doc = Document(
        document_type="PT",
        document_number=data.SoCT,
        document_date=data.NgayCT,
        period_id=data.MaKyKeToan,
        total_amount=data.TienThu,
        description=data.DienGiai,
        status="DRAFT"
    )
    db.add(doc)
    db.flush()

    receipt = Receipt(
        document_id=doc.id,
        customer_id=data.MaKH,
        amount=data.TienThu,
        payment_method=data.HinhThucTT,
        transaction_type=data.LoaiGiaoDich,
        notes=data.DienGiai
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)

    return PhieuThuResponse(
        id=receipt.id,
        SoCT=data.SoCT,
        NgayCT=data.NgayCT,
        MaKH=data.MaKH,
        TienThu=float(data.TienThu),
        HinhThucTT=data.HinhThucTT,
        LoaiGiaoDich=data.LoaiGiaoDich, 
        DienGiai=data.DienGiai,
        TrangThai="DRAFT"
    )

@router.get("/documents/phieu-thu", response_model=list[PhieuThuResponse])
def get_phieu_thu(db: Session = Depends(get_db)):
    rows = (
        db.query(Receipt, Document)
        .join(Document, Receipt.document_id == Document.id)
        .filter(Document.document_type == "PT")
        .all()
    )
    return [
        PhieuThuResponse(
            id=r.id,
            SoCT=d.document_number,
            NgayCT=d.document_date,
            MaKH=r.customer_id,
            TienThu=float(r.amount),
            HinhThucTT=r.payment_method or "",
            LoaiGiaoDich=r.transaction_type or "",  # ✅ THÊM
            DienGiai=r.notes,
            TrangThai=d.status
        ) for r, d in rows
    ]
@router.get("/documents/phieu-thu/{doc_id}")
def get_phieu_thu_detail(doc_id: int, db: Session = Depends(get_db)):
    r, d = db.query(Receipt, Document).join(
        Document, Receipt.document_id == Document.id
    ).filter(Receipt.id == doc_id).first() or (None, None)
    if not r:
        raise HTTPException(404, "Không tìm thấy")
    return {
        "id": r.id, "SoCT": d.document_number,
        "NgayCT": str(d.document_date),
        "MaKH": r.customer_id, "TienThu": float(r.amount),
        "HinhThucTT": r.payment_method,
        "LoaiGiaoDich": r.transaction_type or "",
        "DienGiai": r.notes,
        "TrangThai": d.status,
        "items": []
    }
@router.put("/documents/phieu-thu/{doc_id}")
def update_phieu_thu(doc_id: int, data: PhieuThuCreate, db: Session = Depends(get_db)):
    r, d = db.query(Receipt, Document).join(
        Document, Receipt.document_id == Document.id
    ).filter(Receipt.id == doc_id).first() or (None, None)
    if not r:
        raise HTTPException(404, "Không tìm thấy")

    # Cập nhật Document
    d.document_date = data.NgayCT
    d.period_id = data.MaKyKeToan
    d.total_amount = data.TienThu
    d.description = data.DienGiai

    # Cập nhật Receipt
    r.customer_id = data.MaKH
    r.amount = data.TienThu
    r.payment_method = data.HinhThucTT
    r.transaction_type = data.LoaiGiaoDich
    r.notes = data.DienGiai

    db.commit()
    return {"message": "Cập nhật thành công", "id": doc_id}
# ============ PHIẾU CHI ============
@router.post("/documents/phieu-chi", response_model=PhieuChiResponse, status_code=201)
def create_phieu_chi(data: PhieuChiCreate, db: Session = Depends(get_db)):
    doc = Document(
        document_type="PC",
        document_number=data.SoCT,
        document_date=data.NgayCT,
        period_id=data.MaKyKeToan,
        total_amount=data.TienChi,
        description=data.DienGiai,
        status="DRAFT"
    )
    db.add(doc)
    db.flush()

    payment = Payment(
        document_id=doc.id,
        supplier_id=data.MaNCC,
        amount=data.TienChi,
        payment_method=data.HinhThucTT,
        transaction_type=data.LoaiGiaoDich,
        notes=data.DienGiai
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return PhieuChiResponse(
        id=payment.id,
        SoCT=data.SoCT,
        NgayCT=data.NgayCT,
        TienChi=float(data.TienChi),
        HinhThucTT=data.HinhThucTT,
        LoaiGiaoDich=data.LoaiGiaoDich, 
        DienGiai=data.DienGiai,
        TrangThai="DRAFT"
    )

@router.get("/documents/phieu-chi", response_model=list[PhieuChiResponse])
def get_phieu_chi(db: Session = Depends(get_db)):
    rows = (
        db.query(Payment, Document)
        .join(Document, Payment.document_id == Document.id)
        .filter(Document.document_type == "PC")
        .all()
    )
    return [
        PhieuChiResponse(
            id=p.id,
            SoCT=d.document_number,
            NgayCT=d.document_date,
            MaNCC=p.supplier_id, 
            TienChi=float(p.amount),
            HinhThucTT=p.payment_method or "",
            DienGiai=p.notes,
            TrangThai=d.status
        ) for p, d in rows
    ]
@router.get("/documents/phieu-chi/{doc_id}")
def get_phieu_chi_detail(doc_id: int, db: Session = Depends(get_db)):
    p, d = db.query(Payment, Document).join(
        Document, Payment.document_id == Document.id
    ).filter(Payment.id == doc_id).first() or (None, None)
    if not p:
        raise HTTPException(404, "Không tìm thấy")
    return {
        "id": p.id, "SoCT": d.document_number,
        "NgayCT": str(d.document_date),
        "MaNCC": p.supplier_id, "TienChi": float(p.amount),
        "HinhThucTT": p.payment_method,
        "LoaiGiaoDich": p.transaction_type or "",  # ✅ THÊM
        "DienGiai": p.notes,
        "TrangThai": d.status,
        "items": []
    }
@router.put("/documents/phieu-chi/{doc_id}")
def update_phieu_chi(doc_id: int, data: PhieuChiCreate, db: Session = Depends(get_db)):
    p, d = db.query(Payment, Document).join(
        Document, Payment.document_id == Document.id
    ).filter(Payment.id == doc_id).first() or (None, None)
    if not p:
        raise HTTPException(404, "Không tìm thấy")

    d.document_date = data.NgayCT
    d.period_id = data.MaKyKeToan
    d.total_amount = data.TienChi
    d.description = data.DienGiai

    p.supplier_id = data.MaNCC
    p.amount = data.TienChi
    p.payment_method = data.HinhThucTT
    p.transaction_type = data.LoaiGiaoDich
    p.notes = data.DienGiai

    db.commit()
    return {"message": "Cập nhật thành công", "id": doc_id}
# ============ BÁO CÓ ============
@router.post("/documents/bao-co", response_model=BaoCoResponse, status_code=201)
def create_bao_co(data: BaoCoCreate, db: Session = Depends(get_db)):
    doc = Document(
        document_type="BC",
        document_number=data.SoCT,
        document_date=data.NgayCT,
        period_id=data.MaKyKeToan,
        total_amount=data.SoTien,
        description=data.DienGiai,
        status="DRAFT"
    )
    db.add(doc)
    db.flush()

    bc = BankStatement(
        document_id=doc.id,
        statement_type="BC",
        customer_id=data.MaKH,
        amount=data.SoTien,
        notes=data.DienGiai
    )
    db.add(bc)
    db.commit()
    db.refresh(bc)

    return BaoCoResponse(
        id=bc.id,
        SoCT=data.SoCT,
        NgayCT=data.NgayCT,
        SoTien=float(data.SoTien),
        TrangThai="DRAFT"
    )

@router.get("/documents/bao-co", response_model=list[BaoCoResponse])
def get_bao_co(db: Session = Depends(get_db)):
    rows = (
        db.query(BankStatement, Document)
        .join(Document, BankStatement.document_id == Document.id)
        .filter(BankStatement.statement_type == "BC")
        .all()
    )
    return [
        BaoCoResponse(
            id=b.id,
            SoCT=d.document_number,
            NgayCT=d.document_date,
            MaKH=b.customer_id,
            SoTien=float(b.amount),
            DienGiai=b.notes,
            TrangThai=d.status
        ) for b, d in rows
    ]

@router.get("/documents/bao-co/{doc_id}")
def get_bao_co_detail(doc_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(BankStatement, Document)
        .join(Document, BankStatement.document_id == Document.id)
        .filter(
            BankStatement.id == doc_id,
            BankStatement.statement_type == "BC"
        )
        .first()
    )
    if not result:
        raise HTTPException(404, "Không tìm thấy phiếu báo có")
    b, d = result
    return {
        "id": b.id,
        "SoCT": d.document_number,
        "NgayCT": str(d.document_date),
        "MaKH": b.customer_id,
        "SoTien": float(b.amount or 0),
        "DienGiai": b.notes,
        "TrangThai": d.status or "DRAFT",
        "items": []
    }
@router.put("/documents/bao-co/{doc_id}")
def update_bao_co(doc_id: int, data: BaoCoCreate, db: Session = Depends(get_db)):
    b, d = db.query(BankStatement, Document).join(
        Document, BankStatement.document_id == Document.id
    ).filter(BankStatement.id == doc_id, BankStatement.statement_type=="BC").first() or (None, None)
    if not b:
        raise HTTPException(404, "Không tìm thấy")
    d.document_date = data.NgayCT
    d.period_id = data.MaKyKeToan
    d.total_amount = data.SoTien
    d.description = data.DienGiai
    b.customer_id = data.MaKH
    b.amount = data.SoTien
    b.notes = data.DienGiai
    db.commit()
    return {"message": "Cập nhật thành công", "id": doc_id}
# ============ BÁO NỢ ============
@router.post("/documents/bao-no", response_model=BaoNoResponse, status_code=201)
def create_bao_no(data: BaoNoCreate, db: Session = Depends(get_db)):
    doc = Document(
        document_type="BN",
        document_number=data.SoCT,
        document_date=data.NgayCT,
        period_id=data.MaKyKeToan,
        total_amount=data.SoTien,
        description=data.DienGiai,
        status="DRAFT"
    )
    db.add(doc)
    db.flush()

    bn = BankStatement(
        document_id=doc.id,
        statement_type="BN",
        customer_id=data.MaNCC,
        amount=data.SoTien,
        notes=data.DienGiai
    )
    db.add(bn)
    db.commit()
    db.refresh(bn)

    return BaoNoResponse(
        id=bn.id,
        SoCT=data.SoCT,
        NgayCT=data.NgayCT,
        SoTien=float(data.SoTien),
        TrangThai="DRAFT"
    )

@router.get("/documents/bao-no", response_model=list[BaoNoResponse])
def get_bao_no(db: Session = Depends(get_db)):
    rows = (
        db.query(BankStatement, Document)
        .join(Document, BankStatement.document_id == Document.id)
        .filter(BankStatement.statement_type == "BN")
        .all()
    )
    return [
        BaoNoResponse(
            id=b.id,
            SoCT=d.document_number,
            NgayCT=d.document_date,
            MaNCC=b.customer_id,
            SoTien=float(b.amount),
            DienGiai=b.notes,
            TrangThai=d.status
        ) for b, d in rows
    ]

@router.get("/documents/bao-no/{doc_id}")
def get_bao_no_detail(doc_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(BankStatement, Document)
        .join(Document, BankStatement.document_id == Document.id)
        .filter(
            BankStatement.id == doc_id,
            BankStatement.statement_type == "BN"
        )
        .first()
    )
    if not result:
        raise HTTPException(404, "Không tìm thấy phiếu báo nợ")
    b, d = result
    return {
        "id": b.id,
        "SoCT": d.document_number,
        "NgayCT": str(d.document_date),
        "MaNCC": b.customer_id,
        "SoTien": float(b.amount or 0),
        "DienGiai": b.notes,
        "TrangThai": d.status or "DRAFT",
        "items": []
    }
@router.put("/documents/bao-no/{doc_id}")
def update_bao_no(doc_id: int, data: BaoNoCreate, db: Session = Depends(get_db)):
    b, d = db.query(BankStatement, Document).join(
        Document, BankStatement.document_id == Document.id
    ).filter(BankStatement.id == doc_id, BankStatement.statement_type=="BN").first() or (None, None)
    if not b:
        raise HTTPException(404, "Không tìm thấy")
    d.document_date = data.NgayCT
    d.period_id = data.MaKyKeToan
    d.total_amount = data.SoTien
    d.description = data.DienGiai
    b.customer_id = data.MaNCC
    b.amount = data.SoTien
    b.notes = data.DienGiai
    db.commit()
    return {"message": "Cập nhật thành công", "id": doc_id}
# ============ PHIẾU NHẬP MUA ============

@router.post("/documents/phieu-nhap-mua", response_model=PhieuNhapMuaResponse, status_code=201)
def create_phieu_nhap_mua(data: PhieuNhapMuaCreate, db: Session = Depends(get_db)):
    total_amount = sum(item.SoLuong * item.DonGia + (item.ChiPhiPhanBo or 0) for item in data.DanhSachHang)

    # Dùng json.dumps thay vì f-string để tránh lỗi
    meta = json.dumps({
        "supplier_id": data.MaNCC,
        "dien_giai": data.DienGiai or "",
        "so_hd": data.SoHD or "",
        "ngay_hd": str(data.NgayHD) if data.NgayHD else "",
        "nguoi_gd": data.NguoiGD or "",
        "hinh_thuc_tt": data.HinhThucTT or ""
    })

    doc = Document(
        document_type="PNM",
        document_number=data.SoCT,
        document_date=data.NgayCT,
        period_id=data.MaKyKeToan,
        total_amount=total_amount,
        description=meta,
        status="DRAFT"
    )
    db.add(doc)
    db.flush()

    for item in data.DanhSachHang:
        poi = PurchaseOrderItem(
            purchase_order_id=doc.id,
            product_id=item.MaHH,
            quantity=item.SoLuong,
            unit_price=item.DonGia,
            chi_phi_phan_bo=item.ChiPhiPhanBo or 0,
            notes=item.GhiChu
        )
        db.add(poi)

    db.commit()
    db.refresh(doc)

    return PhieuNhapMuaResponse(
        id=doc.id,
        SoCT=data.SoCT,
        NgayCT=data.NgayCT,
        MaNCC=data.MaNCC,
        TongTien=float(total_amount),
        TrangThai="DRAFT"
    )


@router.get("/documents/phieu-nhap-mua", response_model=list[PhieuNhapMuaResponse])
def get_phieu_nhap_mua(db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.document_type == "PNM").all()
    result = []
    for d in docs:
        supplier_id = None
        try:
            if d.description and d.description.strip().startswith('{'):
                meta = json.loads(d.description)
                supplier_id = meta.get('supplier_id')
        except Exception:
            pass
        result.append(PhieuNhapMuaResponse(
            id=d.id,
            SoCT=d.document_number,
            NgayCT=d.document_date,
            MaNCC=supplier_id,
            TongTien=float(d.total_amount),
            TrangThai=d.status
        ))
    return result
@router.get("/documents/phieu-nhap-mua/{doc_id}")
def get_phieu_nhap_mua_detail(doc_id: int, db: Session = Depends(get_db)):
    d = db.query(Document).filter(
        Document.id == doc_id, Document.document_type == "PNM"
    ).first()
    if not d:
        raise HTTPException(404, "Không tìm thấy")
    items = db.query(PurchaseOrderItem).filter(
        PurchaseOrderItem.purchase_order_id == doc_id
    ).all()
    meta = {}
    try:
        if d.description and d.description.strip().startswith('{'):
            meta = json.loads(d.description)
    except Exception:
        pass
    return {
        "id": d.id,
        "SoCT": d.document_number,
        "NgayCT": str(d.document_date),
        "MaNCC": meta.get('supplier_id'),
        "SoHD": meta.get('so_hd'),
        "NgayHD": meta.get('ngay_hd'),
        "NguoiGD": meta.get('nguoi_gd'),
        "HinhThucTT": meta.get('hinh_thuc_tt'),
        "DienGiai": meta.get('dien_giai'),
        "MaKyKeToan": d.period_id,
        "TongTien": float(d.total_amount or 0),
        "TrangThai": d.status,
        "items": [{
            "product_id": i.product_id,
            "quantity": float(i.quantity),
            "unit_price": float(i.unit_price),
            "chi_phi_phan_bo": float(i.chi_phi_phan_bo or 0),
            "total": float(i.quantity * i.unit_price) + float(i.chi_phi_phan_bo or 0)
        } for i in items]
    }
@router.put("/documents/phieu-nhap-mua/{doc_id}")
def update_phieu_nhap_mua(doc_id: int, data: PhieuNhapMuaCreate, db: Session = Depends(get_db)):
    d = db.query(Document).filter(
        Document.id == doc_id, Document.document_type == "PNM"
    ).first()
    if not d:
        raise HTTPException(404, "Không tìm thấy")

    # Cập nhật header
    meta = json.dumps({
        "supplier_id": data.MaNCC,
        "dien_giai": data.DienGiai or "",
        "so_hd": data.SoHD or "",
        "ngay_hd": str(data.NgayHD) if data.NgayHD else "",
        "nguoi_gd": data.NguoiGD or "",
        "hinh_thuc_tt": data.HinhThucTT or ""
    })
    d.document_date = data.NgayCT
    d.period_id = data.MaKyKeToan
    d.description = meta
    d.total_amount = sum(
        h.SoLuong * h.DonGia + (h.ChiPhiPhanBo or 0)
        for h in data.DanhSachHang
    )

    # Xóa items cũ
    db.query(PurchaseOrderItem).filter(
        PurchaseOrderItem.purchase_order_id == doc_id
    ).delete()

    # Insert items mới
    for item in data.DanhSachHang:
        poi = PurchaseOrderItem(
            purchase_order_id=doc_id,
            product_id=item.MaHH,
            quantity=item.SoLuong,
            unit_price=item.DonGia,
            chi_phi_phan_bo=item.ChiPhiPhanBo or 0,
            notes=item.GhiChu
        )
        db.add(poi)

    db.commit()
    return {"message": "Cập nhật thành công", "id": doc_id}
# ============ PHIẾU BÁN HÀNG ============
@router.post("/documents/phieu-ban-hang", response_model=PhieuBanHangResponse, status_code=201)
def create_phieu_ban_hang(data: PhieuBanHangCreate, db: Session = Depends(get_db)):
    total_amount = sum(item.SoLuong * item.DonGia for item in data.DanhSachHang)

    # Lưu customer_id vào description dạng JSON
    meta = json.dumps({
        "customer_id": data.MaKH,
        "dien_giai": data.DienGiai or "",
        "so_hd": data.SoHD or "",
        "ngay_hd": str(data.NgayHD) if data.NgayHD else "",
        "nguoi_gd": data.NguoiGD or "",
        "hinh_thuc_tt": data.HinhThucTT or ""
    })

    doc = Document(
        document_type="PBH",
        document_number=data.SoCT,
        document_date=data.NgayCT,
        period_id=data.MaKyKeToan,
        total_amount=total_amount,
        description=meta,
        status="DRAFT"
    )
    db.add(doc)
    db.flush()

    for item in data.DanhSachHang:
        soi = SalesOrderItem(
            sales_order_id=doc.id,
            product_id=item.MaHH,
            quantity=item.SoLuong,
            unit_price=item.DonGia,
            notes=item.GhiChu
        )
        db.add(soi)

    db.commit()
    db.refresh(doc)

    return PhieuBanHangResponse(
        id=doc.id,
        SoCT=data.SoCT,
        NgayCT=data.NgayCT,
        MaKH=data.MaKH,          # ← trả về MaKH
        TongTien=float(total_amount),
        TrangThai="DRAFT"
    )

@router.get("/documents/phieu-ban-hang", response_model=list[PhieuBanHangResponse])
def get_phieu_ban_hang(db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.document_type == "PBH").all()
    result = []
    for d in docs:
        customer_id = None
        try:
            if d.description and d.description.strip().startswith('{'):
                meta = json.loads(d.description)
                customer_id = meta.get('customer_id')
        except Exception:
            pass
        result.append(PhieuBanHangResponse(
            id=d.id,
            SoCT=d.document_number,
            NgayCT=d.document_date,
            MaKH=customer_id,     # ← trả về MaKH
            TongTien=float(d.total_amount),
            TrangThai=d.status
        ))
    return result
@router.get("/documents/phieu-ban-hang/{doc_id}")
def get_phieu_ban_hang_detail(doc_id: int, db: Session = Depends(get_db)):
    d = db.query(Document).filter(
        Document.id == doc_id, Document.document_type == "PBH"
    ).first()
    if not d:
        raise HTTPException(404, "Không tìm thấy")
    items = db.query(SalesOrderItem).filter(
        SalesOrderItem.sales_order_id == doc_id
    ).all()
    meta = {}
    try:
        if d.description and d.description.strip().startswith('{'):
            meta = json.loads(d.description)
    except Exception:
        pass
    return {
        "id": d.id, "SoCT": d.document_number,
        "NgayCT": str(d.document_date),
        "MaKH": meta.get('customer_id'), "SoHD": meta.get('so_hd'),
        "DienGiai": meta.get('dien_giai'), "TongTien": float(d.total_amount or 0),
        "TrangThai": d.status,
        "items": [{"product_id": i.product_id, "quantity": i.quantity,
                   "unit_price": float(i.unit_price),
                   "total": float(i.quantity * i.unit_price)} for i in items]
    }
# Thêm 10/05/2026
@router.put("/documents/phieu-ban-hang/{doc_id}")
def update_phieu_ban_hang(doc_id: int, data: PhieuBanHangCreate, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(
        Document.id == doc_id, Document.document_type == "PBH"
    ).first()
    if not doc:
        raise HTTPException(404, "Không tìm thấy")

    meta = json.dumps({
        "customer_id": data.MaKH,
        "dien_giai": data.DienGiai or "",
        "so_hd": data.SoHD or "",
        "ngay_hd": str(data.NgayHD) if data.NgayHD else "",
        "nguoi_gd": data.NguoiGD or "",
        "hinh_thuc_tt": data.HinhThucTT or ""
    })
    doc.document_date = data.NgayCT
    doc.period_id = data.MaKyKeToan
    doc.description = meta

    # Xóa items cũ
    db.query(SalesOrderItem).filter(
        SalesOrderItem.sales_order_id == doc_id
    ).delete()

    # Insert items mới
    total = 0
    for hang in data.DanhSachHang:
        tt = hang.SoLuong * hang.DonGia
        total += tt
        item = SalesOrderItem(
            sales_order_id=doc_id,
            product_id=hang.MaHH,
            quantity=hang.SoLuong,
            unit_price=hang.DonGia,
            notes=hang.GhiChu
        )
        db.add(item)

    doc.total_amount = total
    db.commit()
    return {"message": "Cập nhật thành công", "id": doc_id}


# ============ PHIẾU BÁN LẺ ============
@router.post("/documents/phieu-ban-le", response_model=PhieuBanLeResponse, status_code=201)
def create_phieu_ban_le(data: PhieuBanLeCreate, db: Session = Depends(get_db)):
    total_amount = sum(item.SoLuong * item.DonGia for item in data.DanhSachHang)

    meta = json.dumps({
        "khach_hang": data.KhachHang or "",
        "dien_giai": data.DienGiai or ""
    }, ensure_ascii=False)

    doc = Document(
        document_type="BL",
        document_number=data.SoCT,
        document_date=data.NgayCT,
        period_id=data.MaKyKeToan,
        total_amount=total_amount,
        description=meta,
        status="DRAFT"
    )
    db.add(doc)
    db.flush()

    for item in data.DanhSachHang:
        roi = RetailOrderItem(
            retail_order_id=doc.id,
            product_id=item.MaHH,
            quantity=item.SoLuong,
            unit_price=item.DonGia
        )
        db.add(roi)

    db.commit()
    db.refresh(doc)

    return PhieuBanLeResponse(
        id=doc.id,
        SoCT=data.SoCT,
        NgayCT=data.NgayCT,
        KhachHang=data.KhachHang,
        TongTien=float(total_amount),
        TrangThai="DRAFT"
    )


@router.get("/documents/phieu-ban-le", response_model=list[PhieuBanLeResponse])
def get_phieu_ban_le(db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.document_type == "BL").all()
    result = []
    for d in docs:
        khach_hang = None
        try:
            if d.description:
                stripped = d.description.strip()
                if stripped.startswith('{'):
                    meta = json.loads(stripped)
                    khach_hang = meta.get('khach_hang')
        except Exception:
            khach_hang = None
        result.append(PhieuBanLeResponse(
            id=d.id,
            SoCT=d.document_number,
            NgayCT=d.document_date,
            KhachHang=khach_hang,
            TongTien=float(d.total_amount or 0),
            TrangThai=d.status or "DRAFT"
        ))
    return result


# Thêm endpoint lấy chi tiết phiếu
@router.get("/documents/phieu-ban-le/{doc_id}")
def get_phieu_ban_le_detail(doc_id: int, db: Session = Depends(get_db)):
    d = db.query(Document).filter(
        Document.id == doc_id,
        Document.document_type == "BL"
    ).first()
    if not d:
        raise HTTPException(404, "Không tìm thấy phiếu")

    items = db.query(RetailOrderItem).filter(
        RetailOrderItem.retail_order_id == doc_id
    ).all()

    khach_hang = None
    dien_giai = None
    try:
        if d.description and d.description.strip().startswith('{'):
            meta = json.loads(d.description)
            khach_hang = meta.get('khach_hang')
            dien_giai = meta.get('dien_giai')
    except Exception:
        pass

    return {
        "id": d.id,
        "SoCT": d.document_number,
        "NgayCT": str(d.document_date),
        "KhachHang": khach_hang,
        "DienGiai": dien_giai,
        "TongTien": float(d.total_amount or 0),
        "TrangThai": d.status,
        "items": [
            {
                "product_id": i.product_id,
                "quantity": i.quantity,
                "unit_price": float(i.unit_price),
                "total": float(i.quantity * i.unit_price)
            } for i in items
        ]
    }