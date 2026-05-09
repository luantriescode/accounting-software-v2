"""
Routes cho module Banking - TTG, CTG, TK Ngân hàng
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from decimal import Decimal
from app.database import get_db
from app.modules.banking.models import (
    BankAccount, BankBalance, BankReceiptTransaction, BankPaymentTransaction
)
from app.modules.catalog.models import TransactionType
from app.modules.banking.schemas import (
    BankAccountCreate, BankAccountResponse,
    BankReceiptTransactionCreate, BankReceiptTransactionResponse,
    BankPaymentTransactionCreate, BankPaymentTransactionResponse,
    BankBalanceReport, BankBalanceReportRow,
    DropdownItem, LoaiGiaoDichThuResponse, LoaiGiaoDichChiResponse
)
from app.modules.documents.models import Document
from app.modules.catalog.models import Customer
from app.modules.catalog.models import Supplier

router = APIRouter(tags=["Ngân Hàng | Banking"])


# ============ DROPDOWNS ============
@router.get("/banking/loai-giao-dich-thu", response_model=LoaiGiaoDichThuResponse)
def get_loai_giao_dich_thu(db: Session = Depends(get_db)):
    """Dropdown loại giao dịch thu tiền gửi - lấy từ DB"""
    rows = db.query(TransactionType).filter(
        TransactionType.nhom == "THU",
        TransactionType.is_active == True
    ).order_by(TransactionType.thu_tu, TransactionType.name).all()
    if not rows:
        items = [
            {"value": "Thu tiền nợ", "label": "Thu tiền nợ"},
            {"value": "Thu tiền bán hàng", "label": "Thu tiền bán hàng"},
            {"value": "Thu tiền dịch vụ", "label": "Thu tiền dịch vụ"},
            {"value": "Thu tiền quỹ", "label": "Thu tiền quỹ"},
            {"value": "Thu khác", "label": "Thu khác"},
        ]
    else:
        items = [{"value": r.name, "label": r.name} for r in rows]
    return {"items": items}

@router.get("/banking/loai-giao-dich-chi", response_model=LoaiGiaoDichChiResponse)
def get_loai_giao_dich_chi(db: Session = Depends(get_db)):
    """Dropdown loại giao dịch chi tiền gửi - lấy từ DB"""
    rows = db.query(TransactionType).filter(
        TransactionType.nhom == "CHI",
        TransactionType.is_active == True
    ).order_by(TransactionType.thu_tu, TransactionType.name).all()
    if not rows:
        items = [
            {"value": "Chi trả tiền nợ", "label": "Chi trả tiền nợ"},
            {"value": "Chi tiền mua hàng", "label": "Chi tiền mua hàng"},
            {"value": "Chi lương", "label": "Chi lương"},
            {"value": "Chi nộp bảo hiểm", "label": "Chi nộp bảo hiểm"},
            {"value": "Chi nộp thuế", "label": "Chi nộp thuế"},
            {"value": "Chi phí hoạt động", "label": "Chi phí hoạt động"},
            {"value": "Chi khác", "label": "Chi khác"},
        ]
    else:
        items = [{"value": r.name, "label": r.name} for r in rows]
    return {"items": items}

@router.get("/banking/accounts", response_model=list[BankAccountResponse])
def get_bank_accounts(db: Session = Depends(get_db)):
    """Lấy danh sách tài khoản ngân hàng"""
    accounts = db.query(BankAccount).filter(BankAccount.con_hoat_dong == True).all()
    return [
        BankAccountResponse(
            id=a.id,
            ma_tk=a.ma_tk,
            ten_tk=a.ten_tk,
            loai_tk=a.loai_tk,
            ngan_hang=a.ngan_hang,
            so_tai_khoan=a.so_tai_khoan,
            chu_tai_khoan=a.chu_tai_khoan,
            so_du_hien_tai=float(a.so_du_hien_tai),
            con_hoat_dong=a.con_hoat_dong
        ) for a in accounts
    ]

@router.get("/banking/accounts/{id}", response_model=BankAccountResponse)
def get_bank_account(id: int, db: Session = Depends(get_db)):
    """Lấy chi tiết tài khoản"""
    account = db.query(BankAccount).filter(BankAccount.id == id).first()
    if not account:
        raise HTTPException(404, "Tài khoản không tìm thấy")
    
    return BankAccountResponse(
        id=account.id,
        ma_tk=account.ma_tk,
        ten_tk=account.ten_tk,
        loai_tk=account.loai_tk,
        ngan_hang=account.ngan_hang,
        so_tai_khoan=account.so_tai_khoan,
        chu_tai_khoan=account.chu_tai_khoan,
        so_du_hien_tai=float(account.so_du_hien_tai),
        con_hoat_dong=account.con_hoat_dong
    )


# ============ THU TIỀN GỬI (TTG) ============
@router.post("/banking/ttg", response_model=BankReceiptTransactionResponse, status_code=201)
def create_ttg(data: BankReceiptTransactionCreate, db: Session = Depends(get_db)):
    """Tạo phiếu thu tiền gửi"""
    
    # Kiểm tra mã TK
    account = db.query(BankAccount).filter(BankAccount.id == data.tk_id).first()
    if not account:
        raise HTTPException(404, "Tài khoản không tìm thấy")
    
    # Kiểm tra số chứng từ không trùng
    if db.query(BankReceiptTransaction).filter(
        BankReceiptTransaction.so_chung_tu == data.so_chung_tu,
        BankReceiptTransaction.period_id == data.period_id
    ).first():
        raise HTTPException(400, f"Số chứng từ '{data.so_chung_tu}' đã tồn tại")
    
    # Tạo document master
    doc = Document(
        document_type="TTG",
        document_number=data.so_chung_tu,
        document_date=data.ngay_chung_tu,
        period_id=data.period_id,
        total_amount=data.so_tien_thu,
        status="DRAFT"
    )
    db.add(doc)
    db.flush()
    
    # Tạo TTG
    ttg = BankReceiptTransaction(
        document_id=doc.id,
        tk_id=data.tk_id,
        loai_giao_dich=data.loai_giao_dich,
        so_chung_tu=data.so_chung_tu,
        khach_hang_id=data.khach_hang_id,
        dia_chi=data.dia_chi,
        ngay_chung_tu=data.ngay_chung_tu,
        nguoi_giao_dich=data.nguoi_giao_dich,
        dien_giai=data.dien_giai,
        so_tien_thu=data.so_tien_thu,
        noi_dung=data.noi_dung,
        phieu_thu_id=data.phieu_thu_id,
        period_id=data.period_id,
        trang_thai="DRAFT"
    )
    db.add(ttg)
    
    # CẬP NHẬT SỐ DƯ TK TỰ ĐỘNG
    account.so_du_hien_tai = float(account.so_du_hien_tai) + float(data.so_tien_thu)
    
    db.commit()
    db.refresh(ttg)
    
    return BankReceiptTransactionResponse(
        id=ttg.id,
        so_chung_tu=ttg.so_chung_tu,
        ngay_chung_tu=ttg.ngay_chung_tu,
        loai_giao_dich=ttg.loai_giao_dich,
        so_tien_thu=float(ttg.so_tien_thu),
        noi_dung=ttg.noi_dung,
        da_doi_chieu=ttg.da_doi_chieu,
        trang_thai=ttg.trang_thai
    )
@router.put("/banking/ttg/{id}")
def update_ttg(id: int, data: BankReceiptTransactionCreate, db: Session = Depends(get_db)):
    t = db.query(BankReceiptTransaction).filter(BankReceiptTransaction.id == id).first()
    if not t:
        raise HTTPException(404, "TTG không tìm thấy")
    t.tk_id = data.tk_id
    t.loai_giao_dich = data.loai_giao_dich
    t.ngay_chung_tu = data.ngay_chung_tu
    t.so_tien_thu = data.so_tien_thu
    t.noi_dung = data.noi_dung
    t.period_id = data.period_id
    t.khach_hang_id = data.khach_hang_id    # ✅ THÊM
    db.commit()
    return {"message": "Cập nhật thành công", "id": id}

@router.post("/banking/accounts", summary="Thêm tài khoản quỹ/ngân hàng", status_code=201)
def create_bank_account(data: BankAccountCreate, db: Session = Depends(get_db)):
    existing = db.query(BankAccount).filter(BankAccount.ma_tk == data.ma_tk).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Mã tài khoản '{data.ma_tk}' đã tồn tại!")
    acc = BankAccount(
        ma_tk=data.ma_tk, ten_tk=data.ten_tk, loai_tk=data.loai_tk,
        ngan_hang=data.ngan_hang, so_tai_khoan=data.so_tai_khoan,
        chu_tai_khoan=data.chu_tai_khoan, so_du_hien_tai=data.so_du_hien_tai,
        con_hoat_dong=True
    )
    db.add(acc)
    try:
        db.commit(); db.refresh(acc)
        return {"id":acc.id,"ma_tk":acc.ma_tk,"ten_tk":acc.ten_tk,"loai_tk":acc.loai_tk,"so_du_hien_tai":float(acc.so_du_hien_tai)}
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=400, detail=str(e))

@router.put("/banking/accounts/{id}", summary="Cập nhật tài khoản quỹ/ngân hàng")
def update_bank_account(id: int, data: dict, db: Session = Depends(get_db)):
    acc = db.query(BankAccount).filter(BankAccount.id == id).first()
    if not acc: raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    for k in ["ten_tk","loai_tk","ngan_hang","so_tai_khoan","chu_tai_khoan","so_du_hien_tai","con_hoat_dong"]:
        if k in data: setattr(acc, k, data[k])
    db.commit(); db.refresh(acc)
    return {"id":acc.id,"ma_tk":acc.ma_tk,"ten_tk":acc.ten_tk,"loai_tk":acc.loai_tk,"so_du_hien_tai":float(acc.so_du_hien_tai)}

@router.delete("/banking/accounts/{id}", summary="Xóa tài khoản quỹ/ngân hàng")
def delete_bank_account(id: int, db: Session = Depends(get_db)):
    acc = db.query(BankAccount).filter(BankAccount.id == id).first()
    if not acc: raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    acc.con_hoat_dong = False
    db.commit()
    return {"message": f"Đã xóa tài khoản {acc.ma_tk}"}

@router.get("/banking/ttg", response_model=list[BankReceiptTransactionResponse])
def get_ttg(period_id: int = Query(None), tk_id: int = Query(None), db: Session = Depends(get_db)):
    filters = []
    if period_id:
        filters.append(BankReceiptTransaction.period_id == period_id)
    if tk_id:
        filters.append(BankReceiptTransaction.tk_id == tk_id)

    ttgs = db.query(BankReceiptTransaction).filter(*filters).all()

    # ✅ Load accounts 1 lần tránh N+1
    acc_ids = list({t.tk_id for t in ttgs if t.tk_id})
    acc_map = {a.id: a for a in db.query(BankAccount).filter(BankAccount.id.in_(acc_ids)).all()} if acc_ids else {}

    return [BankReceiptTransactionResponse(
            id=t.id,
            so_chung_tu=t.so_chung_tu,
            ngay_chung_tu=t.ngay_chung_tu,
            loai_giao_dich=t.loai_giao_dich,
            so_tien_thu=float(t.so_tien_thu),
            noi_dung=t.noi_dung,
            da_doi_chieu=t.da_doi_chieu,
            trang_thai=t.trang_thai,
            tk_id=t.tk_id,
            period_id=t.period_id,
            khach_hang_id=t.khach_hang_id,   # ✅ THÊM
        ) for t in ttgs]

@router.get("/banking/ttg/{id}", response_model=BankReceiptTransactionResponse)
def get_ttg_detail(id: int, db: Session = Depends(get_db)):
    """Lấy chi tiết TTG"""
    ttg = db.query(BankReceiptTransaction).filter(BankReceiptTransaction.id == id).first()
    if not ttg:
        raise HTTPException(404, "TTG không tìm thấy")
    
    return BankReceiptTransactionResponse(
        id=ttg.id,
        so_chung_tu=ttg.so_chung_tu,
        ngay_chung_tu=ttg.ngay_chung_tu,
        loai_giao_dich=ttg.loai_giao_dich,
        so_tien_thu=float(ttg.so_tien_thu),
        noi_dung=ttg.noi_dung,
        da_doi_chieu=ttg.da_doi_chieu,
        trang_thai=ttg.trang_thai,
        tk_id=ttg.tk_id,                # đã có
        period_id=ttg.period_id,         # ✅ THÊM
        khach_hang_id=ttg.khach_hang_id  # ✅ THÊM
    )


# ============ CHI TIỀN GỬI (CTG) ============
@router.post("/banking/ctg", response_model=BankPaymentTransactionResponse, status_code=201)
def create_ctg(data: BankPaymentTransactionCreate, db: Session = Depends(get_db)):
    """Tạo phiếu chi tiền gửi"""
    
    # Kiểm tra mã TK
    account = db.query(BankAccount).filter(BankAccount.id == data.tk_id).first()
    if not account:
        raise HTTPException(404, "Tài khoản không tìm thấy")
    
    # Kiểm tra số dư đủ
    if float(account.so_du_hien_tai) < float(data.so_tien_chi):
        raise HTTPException(400, f"Số dư không đủ. Số dư hiện tại: {account.so_du_hien_tai}")
    
    # Kiểm tra số chứng từ không trùng
    if db.query(BankPaymentTransaction).filter(
        BankPaymentTransaction.so_chung_tu == data.so_chung_tu,
        BankPaymentTransaction.period_id == data.period_id
    ).first():
        raise HTTPException(400, f"Số chứng từ '{data.so_chung_tu}' đã tồn tại")
    
    # Tạo document master
    doc = Document(
        document_type="CTG",
        document_number=data.so_chung_tu,
        document_date=data.ngay_chung_tu,
        period_id=data.period_id,
        total_amount=data.so_tien_chi,
        status="DRAFT"
    )
    db.add(doc)
    db.flush()
    
    # Tạo CTG
    ctg = BankPaymentTransaction(
        document_id=doc.id,
        tk_id=data.tk_id,
        loai_giao_dich=data.loai_giao_dich,
        so_chung_tu=data.so_chung_tu,
        supplier_id=data.supplier_id,
        dia_chi=data.dia_chi,
        ngay_chung_tu=data.ngay_chung_tu,
        nguoi_giao_dich=data.nguoi_giao_dich,
        dien_giai=data.dien_giai,
        so_tien_chi=data.so_tien_chi,
        noi_dung=data.noi_dung,
        ma_phi=data.ma_phi,
        phieu_chi_id=data.phieu_chi_id,
        period_id=data.period_id,
        trang_thai="DRAFT"
    )
    db.add(ctg)
    
    # CẬP NHẬT SỐ DƯ TK TỰ ĐỘNG
    account.so_du_hien_tai = float(account.so_du_hien_tai) - float(data.so_tien_chi)
    
    db.commit()
    db.refresh(ctg)
    
    return BankPaymentTransactionResponse(
        id=ctg.id,
        so_chung_tu=ctg.so_chung_tu,
        ngay_chung_tu=ctg.ngay_chung_tu,
        loai_giao_dich=ctg.loai_giao_dich,
        so_tien_chi=float(ctg.so_tien_chi),
        noi_dung=ctg.noi_dung,
        ma_phi=ctg.ma_phi,
        da_doi_chieu=ctg.da_doi_chieu,
        trang_thai=ctg.trang_thai
    )

@router.get("/banking/ctg", response_model=list[BankPaymentTransactionResponse])
def get_ctg(period_id: int = Query(None), tk_id: int = Query(None), db: Session = Depends(get_db)):
    filters = []
    if period_id:
        filters.append(BankPaymentTransaction.period_id == period_id)
    if tk_id:
        filters.append(BankPaymentTransaction.tk_id == tk_id)

    ctgs = db.query(BankPaymentTransaction).filter(*filters).all()

    # ✅ Load accounts 1 lần tránh N+1
    acc_ids = list({c.tk_id for c in ctgs if c.tk_id})
    acc_map = {a.id: a for a in db.query(BankAccount).filter(BankAccount.id.in_(acc_ids)).all()} if acc_ids else {}

    return [BankPaymentTransactionResponse(
            id=c.id,
            so_chung_tu=c.so_chung_tu,
            ngay_chung_tu=c.ngay_chung_tu,
            loai_giao_dich=c.loai_giao_dich,
            so_tien_chi=float(c.so_tien_chi),
            noi_dung=c.noi_dung,
            ma_phi=c.ma_phi,
            da_doi_chieu=c.da_doi_chieu,
            trang_thai=c.trang_thai,
            tk_id=c.tk_id,
            period_id=c.period_id,
            supplier_id=c.supplier_id,        # ✅ THÊM
        ) for c in ctgs]

@router.get("/banking/ctg/{id}", response_model=BankPaymentTransactionResponse)
def get_ctg_detail(id: int, db: Session = Depends(get_db)):
    """Lấy chi tiết CTG"""
    ctg = db.query(BankPaymentTransaction).filter(BankPaymentTransaction.id == id).first()
    if not ctg:
        raise HTTPException(404, "CTG không tìm thấy")
    
    return BankPaymentTransactionResponse(
        id=ctg.id,
        so_chung_tu=ctg.so_chung_tu,
        ngay_chung_tu=ctg.ngay_chung_tu,
        loai_giao_dich=ctg.loai_giao_dich,
        so_tien_chi=float(ctg.so_tien_chi),
        noi_dung=ctg.noi_dung,
        ma_phi=ctg.ma_phi,
        da_doi_chieu=ctg.da_doi_chieu,
        trang_thai=ctg.trang_thai,
        tk_id=ctg.tk_id,                # đã có
        period_id=ctg.period_id,         # ✅ THÊM
        supplier_id=ctg.supplier_id        # ✅ THÊM
    )
@router.put("/banking/ctg/{id}")
def update_ctg(id: int, data: BankPaymentTransactionCreate, db: Session = Depends(get_db)):
    t = db.query(BankPaymentTransaction).filter(BankPaymentTransaction.id == id).first()
    if not t:
        raise HTTPException(404, "CTG không tìm thấy")
    t.tk_id = data.tk_id
    t.loai_giao_dich = data.loai_giao_dich
    t.ngay_chung_tu = data.ngay_chung_tu
    t.so_tien_chi = data.so_tien_chi
    t.noi_dung = data.noi_dung
    t.period_id = data.period_id
    t.supplier_id = data.supplier_id  
    db.commit()
    return {"message": "Cập nhật thành công", "id": id}

# ============ BÁO CÁO SỐ DƯ TK ============
@router.get("/banking/bao-cao-so-du", response_model=BankBalanceReport)
def generate_bank_balance_report(
    period_id: int = Query(..., description="Kỳ kế toán"),
    db: Session = Depends(get_db)
):
    """Báo cáo số dư tài khoản ngân hàng theo kỳ"""
    
    from app.modules.catalog.models import FiscalPeriod
    
    # Lấy thông tin kỳ
    period = db.query(FiscalPeriod).filter(FiscalPeriod.id == period_id).first()
    if not period:
        raise HTTPException(404, "Kỳ kế toán không tìm thấy")
    
    # Lấy dữ liệu từ bank_balances
    balances = db.query(BankBalance).filter(BankBalance.period_id == period_id).all()
    
    rows = []
    tong_du_dau_ky = 0
    tong_thu_all = 0
    tong_chi_all = 0
    tong_du_cuoi_ky = 0
    
    for balance in balances:
        account = db.query(BankAccount).filter(BankAccount.id == balance.tk_id).first()
        
        if account:
            row = BankBalanceReportRow(
                ma_tk=account.ma_tk,
                ten_tk=account.ten_tk,
                loai_tk=account.loai_tk,
                so_du_dau_ky=float(balance.so_du_dau_ky),
                tong_thu=float(balance.tong_thu),
                tong_chi=float(balance.tong_chi),
                so_du_cuoi_ky=float(balance.so_du_cuoi_ky)
            )
            rows.append(row)
            
            tong_du_dau_ky += float(balance.so_du_dau_ky)
            tong_thu_all += float(balance.tong_thu)
            tong_chi_all += float(balance.tong_chi)
            tong_du_cuoi_ky += float(balance.so_du_cuoi_ky)
    
    if not rows:
        raise HTTPException(404, f"Không có dữ liệu cho kỳ {period.period_name}")
    
    report = BankBalanceReport(
        period_name=period.period_name,
        report_date=datetime.now().isoformat(),
        rows=rows,
        tong_du_dau_ky=tong_du_dau_ky,
        tong_thu_all=tong_thu_all,
        tong_chi_all=tong_chi_all,
        tong_du_cuoi_ky=tong_du_cuoi_ky
    )
    
    return report