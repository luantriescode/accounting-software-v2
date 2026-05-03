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
            DienGiai=r.notes,
            TrangThai=d.status
        ) for r, d in rows
    ]


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
            SoTien=float(b.amount),
            TrangThai=d.status
        ) for b, d in rows
    ]


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
            SoTien=float(b.amount),
            TrangThai=d.status
        ) for b, d in rows
    ]


# ============ PHIẾU NHẬP MUA ============

@router.post("/documents/phieu-nhap-mua", response_model=PhieuNhapMuaResponse, status_code=201)
def create_phieu_nhap_mua(data: PhieuNhapMuaCreate, db: Session = Depends(get_db)):
    total_amount = sum(item.SoLuong * item.DonGia for item in data.DanhSachHang)

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
# ============ PHIẾU BÁN HÀNG ============
@router.post("/documents/phieu-ban-hang", response_model=PhieuBanHangResponse, status_code=201)
def create_phieu_ban_hang(data: PhieuBanHangCreate, db: Session = Depends(get_db)):
    total_amount = sum(item.SoLuong * item.DonGia for item in data.DanhSachHang)

    doc = Document(
        document_type="PBH",
        document_number=data.SoCT,
        document_date=data.NgayCT,
        period_id=data.MaKyKeToan,
        total_amount=total_amount,
        description=data.DienGiai,
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
        MaKH=data.MaKH,
        TongTien=float(total_amount),
        TrangThai="DRAFT"
    )

@router.get("/documents/phieu-ban-hang", response_model=list[PhieuBanHangResponse])
def get_phieu_ban_hang(db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.document_type == "PBH").all()
    return [
        PhieuBanHangResponse(
            id=d.id,
            SoCT=d.document_number,
            NgayCT=d.document_date,
            MaKH=None,
            TongTien=float(d.total_amount),
            TrangThai=d.status
        ) for d in docs
    ]


# ============ PHIẾU BÁN LẺ ============
@router.post("/documents/phieu-ban-le", response_model=PhieuBanLeResponse, status_code=201)
def create_phieu_ban_le(data: PhieuBanLeCreate, db: Session = Depends(get_db)):
    total_amount = sum(item.SoLuong * item.DonGia for item in data.DanhSachHang)

    doc = Document(
        document_type="BL",
        document_number=data.SoCT,
        document_date=data.NgayCT,
        period_id=data.MaKyKeToan,
        total_amount=total_amount,
        description=data.DienGiai,
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
    return [
        PhieuBanLeResponse(
            id=d.id,
            SoCT=d.document_number,
            NgayCT=d.document_date,
            KhachHang=None,
            TongTien=float(d.total_amount),
            TrangThai=d.status
        ) for d in docs
    ]