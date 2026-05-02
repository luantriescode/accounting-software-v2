"""Routes cho module Catalog - Khách hàng, NCC, Sản phẩm, Kho, Dropdown"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel as PydanticBase
from typing import Optional
from app.database import get_db
from app.modules.catalog.models import Customer, Supplier, Product, Warehouse, FiscalPeriod, Unit, TransactionType, SystemConfig
from app.modules.catalog.schemas import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    SupplierCreate, SupplierUpdate, SupplierResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    WarehouseCreate, WarehouseResponse,
    FiscalPeriodResponse
)

router = APIRouter(tags=["Danh Mục | Catalog"])


# ============================================
# HELPERS
# ============================================
def _map_customer(c) -> CustomerResponse:
    return CustomerResponse(
        id=c.id, MaKH=c.code, TenKH=c.name,
        DiaChi=c.address, SDT=c.phone, Email=c.email,
        MST=c.tax_code, HanMucTinDung=float(c.credit_limit or 0),
        ConHoatDong=c.is_active
    )

def _map_supplier(s) -> SupplierResponse:
    return SupplierResponse(
        id=s.id, MaNCC=s.code, TenNCC=s.name,
        DiaChi=s.address, SDT=s.phone, Email=s.email,
        MST=s.tax_code, HanThanhToan=s.payment_term or 30,
        ConHoatDong=s.is_active
    )

def _map_product(p) -> ProductResponse:
    return ProductResponse(
        id=p.id, MaHH=p.code, TenHH=p.name,
        DVT=p.unit, DanhMuc=p.category,
        GiaBan=float(p.unit_price) if p.unit_price else None,
        TonKhoToiThieu=p.reorder_level or 10,
        ConHoatDong=p.is_active
    )

def _map_warehouse(w) -> WarehouseResponse:
    return WarehouseResponse(
        id=w.id, MaKho=w.code, TenKho=w.name,
        DiaChi=w.address, NguoiQuanLy=w.manager_name,
        ConHoatDong=w.is_active
    )


# ============================================
# CUSTOMERS
# ============================================
@router.post("/customers", response_model=CustomerResponse, status_code=201, summary="Tạo khách hàng")
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    if db.query(Customer).filter(Customer.code == data.MaKH).first():
        raise HTTPException(400, f"Mã KH '{data.MaKH}' đã tồn tại")
    c = Customer(code=data.MaKH, name=data.TenKH, address=data.DiaChi,
                 phone=data.SDT, email=data.Email, tax_code=data.MST,
                 credit_limit=data.HanMucTinDung, is_active=data.ConHoatDong)
    db.add(c); db.commit(); db.refresh(c)
    return _map_customer(c)

@router.get("/customers", response_model=list[CustomerResponse], summary="Danh sách khách hàng")
def get_customers(db: Session = Depends(get_db)):
    return [_map_customer(c) for c in db.query(Customer).filter(Customer.is_active == True).all()]

@router.get("/customers/{customer_id}", response_model=CustomerResponse, summary="Chi tiết khách hàng")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c: raise HTTPException(404, "Khách hàng không tìm thấy")
    return _map_customer(c)

@router.put("/customers/{customer_id}", response_model=CustomerResponse, summary="Cập nhật khách hàng")
def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c: raise HTTPException(404, "Khách hàng không tìm thấy")
    if data.TenKH: c.name = data.TenKH
    if data.DiaChi is not None: c.address = data.DiaChi
    if data.SDT is not None: c.phone = data.SDT
    if data.Email is not None: c.email = data.Email
    if data.MST is not None: c.tax_code = data.MST
    if data.HanMucTinDung is not None: c.credit_limit = data.HanMucTinDung
    if data.ConHoatDong is not None: c.is_active = data.ConHoatDong
    db.commit(); db.refresh(c)
    return _map_customer(c)


# ============================================
# SUPPLIERS
# ============================================
@router.post("/suppliers", response_model=SupplierResponse, status_code=201, summary="Tạo nhà cung cấp")
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db)):
    if db.query(Supplier).filter(Supplier.code == data.MaNCC).first():
        raise HTTPException(400, f"Mã NCC '{data.MaNCC}' đã tồn tại")
    s = Supplier(code=data.MaNCC, name=data.TenNCC, address=data.DiaChi,
                 phone=data.SDT, email=data.Email, tax_code=data.MST,
                 payment_term=data.HanThanhToan, is_active=data.ConHoatDong)
    db.add(s); db.commit(); db.refresh(s)
    return _map_supplier(s)

@router.get("/suppliers", response_model=list[SupplierResponse], summary="Danh sách NCC")
def get_suppliers(db: Session = Depends(get_db)):
    return [_map_supplier(s) for s in db.query(Supplier).filter(Supplier.is_active == True).all()]

@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse, summary="Chi tiết NCC")
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s: raise HTTPException(404, "NCC không tìm thấy")
    return _map_supplier(s)

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse, summary="Cập nhật NCC")
def update_supplier(supplier_id: int, data: SupplierUpdate, db: Session = Depends(get_db)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s: raise HTTPException(404, "NCC không tìm thấy")
    if data.TenNCC: s.name = data.TenNCC
    if data.DiaChi is not None: s.address = data.DiaChi
    if data.SDT is not None: s.phone = data.SDT
    if data.Email is not None: s.email = data.Email
    if data.MST is not None: s.tax_code = data.MST
    if data.HanThanhToan is not None: s.payment_term = data.HanThanhToan
    if data.ConHoatDong is not None: s.is_active = data.ConHoatDong
    db.commit(); db.refresh(s)
    return _map_supplier(s)


# ============================================
# PRODUCTS
# ============================================
@router.post("/products", response_model=ProductResponse, status_code=201, summary="Tạo sản phẩm")
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    if db.query(Product).filter(Product.code == data.MaHH).first():
        raise HTTPException(400, f"Mã HH '{data.MaHH}' đã tồn tại")
    p = Product(code=data.MaHH, name=data.TenHH, unit=data.DVT,
                category=data.DanhMuc, unit_price=data.GiaBan,
                reorder_level=data.TonKhoToiThieu, is_active=data.ConHoatDong)
    db.add(p); db.commit(); db.refresh(p)
    return _map_product(p)

@router.get("/products", response_model=list[ProductResponse], summary="Danh sách sản phẩm")
def get_products(db: Session = Depends(get_db)):
    return [_map_product(p) for p in db.query(Product).filter(Product.is_active == True).all()]

@router.get("/products/{product_id}", response_model=ProductResponse, summary="Chi tiết sản phẩm")
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p: raise HTTPException(404, "Sản phẩm không tìm thấy")
    return _map_product(p)

@router.put("/products/{product_id}", response_model=ProductResponse, summary="Cập nhật sản phẩm")
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p: raise HTTPException(404, "Sản phẩm không tìm thấy")
    if data.TenHH: p.name = data.TenHH
    if data.DVT is not None: p.unit = data.DVT
    if data.DanhMuc is not None: p.category = data.DanhMuc
    if data.GiaBan is not None: p.unit_price = data.GiaBan
    if data.TonKhoToiThieu is not None: p.reorder_level = data.TonKhoToiThieu
    if data.ConHoatDong is not None: p.is_active = data.ConHoatDong
    db.commit(); db.refresh(p)
    return _map_product(p)


# ============================================
# WAREHOUSES
# ============================================
@router.post("/warehouses", response_model=WarehouseResponse, status_code=201, summary="Tạo kho hàng")
def create_warehouse(data: WarehouseCreate, db: Session = Depends(get_db)):
    if db.query(Warehouse).filter(Warehouse.code == data.MaKho).first():
        raise HTTPException(400, f"Mã Kho '{data.MaKho}' đã tồn tại")
    w = Warehouse(code=data.MaKho, name=data.TenKho, address=data.DiaChi,
                  manager_name=data.NguoiQuanLy, is_active=data.ConHoatDong)
    db.add(w); db.commit(); db.refresh(w)
    return _map_warehouse(w)

@router.get("/warehouses", response_model=list[WarehouseResponse], summary="Danh sách kho")
def get_warehouses(db: Session = Depends(get_db)):
    return [_map_warehouse(w) for w in db.query(Warehouse).filter(Warehouse.is_active == True).all()]

@router.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse, summary="Chi tiết kho")
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w: raise HTTPException(404, "Kho không tìm thấy")
    return _map_warehouse(w)


# ============================================
# CATEGORIES / DROPDOWN
# ============================================
@router.get("/categories/ky-ke-toan", summary="Dropdown kỳ kế toán")
def get_ky_ke_toan(db: Session = Depends(get_db)):
    periods = db.query(FiscalPeriod).filter(FiscalPeriod.is_closed == False).order_by(FiscalPeriod.start_date).all()
    return [{"id": p.id, "MaKy": p.period_code, "TenKy": p.period_name,
             "NgayBatDau": str(p.start_date), "NgayKetThuc": str(p.end_date)} for p in periods]

@router.get("/categories/loai-giao-dich-thu", summary="Dropdown loại GD thu")
def get_loai_giao_dich_thu(db: Session = Depends(get_db)):
    rows = db.query(TransactionType).filter(
        TransactionType.nhom == "THU",
        TransactionType.is_active == True
    ).order_by(TransactionType.thu_tu, TransactionType.name).all()
    if not rows:
        # Fallback nếu DB chưa có dữ liệu
        return [
            {"value": "Thu tiền nợ", "label": "Thu tiền nợ"},
            {"value": "Thu tiền bán hàng", "label": "Thu tiền bán hàng"},
            {"value": "Thu tiền dịch vụ", "label": "Thu tiền dịch vụ"},
            {"value": "Thu tiền quỹ", "label": "Thu tiền quỹ"},
            {"value": "Thu khác", "label": "Thu khác"},
        ]
    return [{"value": r.name, "label": r.name, "id": r.id, "code": r.code} for r in rows]

@router.get("/categories/loai-giao-dich-chi", summary="Dropdown loại GD chi")
def get_loai_giao_dich_chi(db: Session = Depends(get_db)):
    rows = db.query(TransactionType).filter(
        TransactionType.nhom == "CHI",
        TransactionType.is_active == True
    ).order_by(TransactionType.thu_tu, TransactionType.name).all()
    if not rows:
        # Fallback nếu DB chưa có dữ liệu
        return [
            {"value": "Chi trả tiền nợ", "label": "Chi trả tiền nợ"},
            {"value": "Chi tiền mua hàng", "label": "Chi tiền mua hàng"},
            {"value": "Chi lương", "label": "Chi lương"},
            {"value": "Chi nộp bảo hiểm", "label": "Chi nộp bảo hiểm"},
            {"value": "Chi nộp thuế", "label": "Chi nộp thuế"},
            {"value": "Chi phí hoạt động", "label": "Chi phí hoạt động"},
            {"value": "Chi khác", "label": "Chi khác"},
        ]
    return [{"value": r.name, "label": r.name, "id": r.id, "code": r.code} for r in rows]

@router.get("/categories/hinh-thuc-thanh-toan", summary="Dropdown hình thức TT")
def get_hinh_thuc_thanh_toan():
    return [
        {"value": "Tiền mặt", "label": "Tiền mặt"},
        {"value": "Tiền gửi ngân hàng", "label": "Tiền gửi ngân hàng"},
        {"value": "Khác", "label": "Khác"},
    ]

@router.get("/categories/loai-phieu-nhap-kho", summary="Dropdown loại phiếu nhập kho")
def get_loai_phieu_nhap():
    return [
        {"value": "Nhập thành phẩm", "label": "Nhập thành phẩm"},
        {"value": "Nhập từ NCC", "label": "Nhập từ NCC"},
        {"value": "Nhập kho mua hàng", "label": "Nhập kho mua hàng"},
        {"value": "Nhập khác", "label": "Nhập khác"},
    ]

@router.get("/categories/loai-phieu-xuat-kho", summary="Dropdown loại phiếu xuất kho")
def get_loai_phieu_xuat():
    return [
        {"value": "Xuất bán", "label": "Xuất bán"},
        {"value": "Xuất hàng hỏng", "label": "Xuất hàng hỏng"},
        {"value": "Sử dụng nội bộ", "label": "Sử dụng nội bộ"},
        {"value": "Xuất khác", "label": "Xuất khác"},
    ]

@router.get("/categories/all", summary="Tất cả dropdown")
def get_all_categories(db: Session = Depends(get_db)):
    periods = db.query(FiscalPeriod).filter(FiscalPeriod.is_closed == False).order_by(FiscalPeriod.start_date).all()
    return {
        "ky_ke_toan": [{"id": p.id, "MaKy": p.period_code, "TenKy": p.period_name} for p in periods],
        "loai_giao_dich_thu": ["Thu tiền nợ", "Thu tiền bán hàng", "Thu tiền quỹ", "Thu khác"],
        "loai_giao_dich_chi": ["Chi trả tiền nợ", "Chi lương/nộp bảo hiểm", "Chi nộp tiền thuế vào NSNN", "Trả tiền thừa khách hàng", "Chi tiền mua hàng", "Chi khác"],
        "hinh_thuc_thanh_toan": ["Tiền mặt", "Tiền gửi ngân hàng", "Khác"],
        "loai_phieu_nhap": ["Nhập thành phẩm", "Nhập từ NCC", "Nhập kho mua hàng", "Nhập khác"],
        "loai_phieu_xuat": ["Xuất bán", "Xuất hàng hỏng", "Sử dụng nội bộ", "Xuất khác"],
    }
"""
THÊM VÀO FILE: backend/app/modules/catalog/routes.py
Chèn các endpoint /units vào cuối file
Import thêm Unit vào dòng from .models import ...
"""

# ── Thêm Unit vào import (dòng from .models import ...) ──────────────────
# from .models import Customer, Supplier, Product, Warehouse, ..., Unit   ← thêm Unit

# ── Thêm UnitCreate, UnitUpdate vào schemas (từ .schemas import) ──────────
# Hoặc dùng inline Pydantic như bên dưới



class UnitCreate(PydanticBase):
    code:        str
    name:        str
    description: Optional[str] = None
    is_active:   bool = True

class UnitUpdate(PydanticBase):
    name:        Optional[str] = None
    description: Optional[str] = None
    is_active:   Optional[bool] = None

# ── Endpoints - dán vào cuối catalog/routes.py ────────────────────────────

@router.get("/units", tags=["Catalog | Units"])
async def get_units(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Lấy danh sách đơn vị tính"""
    q = db.query(Unit)
    if is_active is not None:
        q = q.filter(Unit.is_active == is_active)
    return q.order_by(Unit.code).all()


@router.post("/units", tags=["Catalog | Units"], status_code=201)
async def create_unit(unit: UnitCreate, db: Session = Depends(get_db)):
    """Tạo đơn vị tính mới"""
    existing = db.query(Unit).filter(Unit.code == unit.code).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Mã ĐVT '{unit.code}' đã tồn tại"
        )
    db_unit = Unit(**unit.dict())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.get("/units/{unit_id}", tags=["Catalog | Units"])
async def get_unit(unit_id: int, db: Session = Depends(get_db)):
    """Lấy chi tiết một ĐVT"""
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Không tìm thấy ĐVT")
    return unit


@router.put("/units/{unit_id}", tags=["Catalog | Units"])
async def update_unit(
    unit_id: int,
    unit: UnitUpdate,
    db: Session = Depends(get_db)
):
    """Cập nhật ĐVT (tên, mô tả, trạng thái)"""
    db_unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Không tìm thấy ĐVT")
    for k, v in unit.dict(exclude_unset=True).items():
        setattr(db_unit, k, v)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.delete("/units/{unit_id}", tags=["Catalog | Units"])
async def deactivate_unit(unit_id: int, db: Session = Depends(get_db)):
    """Ngừng sử dụng ĐVT (soft delete)"""
    db_unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Không tìm thấy ĐVT")
    db_unit.is_active = False
    db.commit()
    return {"message": f"Đã ngừng sử dụng ĐVT '{db_unit.code}'"}

# ============================================================
# CRUD LOẠI GIAO DỊCH
# ============================================================
@router.get("/transaction-types", summary="Danh sách loại giao dịch")
def get_transaction_types(nhom: str = None, db: Session = Depends(get_db)):
    q = db.query(TransactionType)
    if nhom:
        q = q.filter(TransactionType.nhom == nhom)
    return q.order_by(TransactionType.nhom, TransactionType.thu_tu, TransactionType.name).all()

@router.post("/transaction-types", summary="Thêm loại giao dịch", status_code=201)
def create_transaction_type(data: dict, db: Session = Depends(get_db)):
    # Validate nhom
    if data.get("nhom") not in ["THU", "CHI", "CA_HAI"]:
        raise HTTPException(status_code=400, detail="nhom phải là THU, CHI hoặc CA_HAI")
    tt = TransactionType(
        code=data["code"],
        name=data["name"],
        nhom=data["nhom"],
        ap_dung_cho=data.get("ap_dung_cho", "ALL"),
        mo_ta=data.get("mo_ta"),
        thu_tu=data.get("thu_tu", 0),
        is_active=data.get("is_active", True)
    )
    db.add(tt)
    try:
        db.commit()
        db.refresh(tt)
        return tt
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Mã loại GD đã tồn tại: {str(e)}")

@router.put("/transaction-types/{id}", summary="Cập nhật loại giao dịch")
def update_transaction_type(id: int, data: dict, db: Session = Depends(get_db)):
    tt = db.query(TransactionType).filter(TransactionType.id == id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Không tìm thấy loại giao dịch")
    for k, v in data.items():
        if hasattr(tt, k):
            setattr(tt, k, v)
    db.commit()
    db.refresh(tt)
    return tt

@router.delete("/transaction-types/{id}", summary="Xóa loại giao dịch")
def delete_transaction_type(id: int, db: Session = Depends(get_db)):
    tt = db.query(TransactionType).filter(TransactionType.id == id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Không tìm thấy loại giao dịch")
    db.delete(tt)
    db.commit()
    return {"message": "Đã xóa loại giao dịch"}

@router.post("/transaction-types/init-default", summary="Khởi tạo dữ liệu mặc định")
def init_default_transaction_types(db: Session = Depends(get_db)):
    """Tạo các loại giao dịch mặc định nếu bảng còn trống"""
    existing = db.query(TransactionType).count()
    if existing > 0:
        return {"message": f"Đã có {existing} loại giao dịch, bỏ qua."}
    defaults = [
        # THU
        {"code":"THU001","name":"Thu tiền bán hàng","nhom":"THU","ap_dung_cho":"ALL","thu_tu":1},
        {"code":"THU002","name":"Thu tiền dịch vụ","nhom":"THU","ap_dung_cho":"ALL","thu_tu":2},
        {"code":"THU003","name":"Thu tiền nợ","nhom":"THU","ap_dung_cho":"ALL","thu_tu":3},
        {"code":"THU004","name":"Thu tiền quỹ","nhom":"THU","ap_dung_cho":"PT","thu_tu":4},
        {"code":"THU005","name":"Thu ký quỹ / đặt cọc","nhom":"THU","ap_dung_cho":"ALL","thu_tu":5},
        {"code":"THU006","name":"Thu khác","nhom":"THU","ap_dung_cho":"ALL","thu_tu":99},
        # CHI
        {"code":"CHI001","name":"Chi tiền mua hàng","nhom":"CHI","ap_dung_cho":"ALL","thu_tu":1},
        {"code":"CHI002","name":"Chi trả tiền nợ","nhom":"CHI","ap_dung_cho":"ALL","thu_tu":2},
        {"code":"CHI003","name":"Chi lương","nhom":"CHI","ap_dung_cho":"ALL","thu_tu":3},
        {"code":"CHI004","name":"Chi nộp bảo hiểm","nhom":"CHI","ap_dung_cho":"ALL","thu_tu":4},
        {"code":"CHI005","name":"Chi nộp thuế","nhom":"CHI","ap_dung_cho":"ALL","thu_tu":5},
        {"code":"CHI006","name":"Chi phí hoạt động","nhom":"CHI","ap_dung_cho":"ALL","thu_tu":6},
        {"code":"CHI007","name":"Chi trả lại tiền thừa KH","nhom":"CHI","ap_dung_cho":"ALL","thu_tu":7},
        {"code":"CHI008","name":"Chi ký quỹ / đặt cọc","nhom":"CHI","ap_dung_cho":"ALL","thu_tu":8},
        {"code":"CHI009","name":"Chi khác","nhom":"CHI","ap_dung_cho":"ALL","thu_tu":99},
    ]
    for d in defaults:
        db.add(TransactionType(**d))
    db.commit()
    return {"message": f"Đã tạo {len(defaults)} loại giao dịch mặc định"}


# ============================================================
# SYSTEM CONFIG - API dùng chung cho tất cả danh mục nhỏ
# ============================================================
import json

def _parse_config(raw):
    """Parse config_data - xử lý cả JSONB (list/dict) và Text (string)"""
    if isinstance(raw, (dict, list)):
        return raw
    if isinstance(raw, str):
        try: return json.loads(raw)
        except: return []
    return []

@router.get("/system-config/{key}", summary="Lấy config theo key")
def get_config(key: str, db: Session = Depends(get_db)):
    row = db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
    if not row:
        # Tự tạo row rỗng nếu chưa có
        row = SystemConfig(config_key=key, config_name=key, config_data="[]")
        db.add(row)
        db.commit()
        db.refresh(row)
    return {"key": row.config_key, "name": row.config_name, "data": row.config_data if isinstance(row.config_data, (list,dict)) else _parse_config(row.config_data)}

@router.put("/system-config/{key}", summary="Lưu toàn bộ data của 1 key")
def save_config(key: str, payload: dict, db: Session = Depends(get_db)):
    row = db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
    data = payload.get("data", [])
    if row:
        row.config_data = list(data) if isinstance(data, list) else data
        row.config_name = payload.get("name", row.config_name)
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(row, "config_data")
    else:
        row = SystemConfig(
            config_key=key,
            config_name=payload.get("name", key),
            config_data=data
        )
        db.add(row)
    db.commit()
    return {"key": key, "data": data, "message": "Lưu thành công!"}

@router.post("/system-config/{key}/add-item", summary="Thêm 1 item vào danh sách")
def add_config_item(key: str, item: dict, db: Session = Depends(get_db)):
    import sys
    print(f"[add_config_item] key={key} item={item}", file=sys.stderr)
    row = db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
    if not row:
        print(f"[add_config_item] Row not found, creating new for key={key}", file=sys.stderr)
        row = SystemConfig(config_key=key, config_name=key, config_data=[])
        db.add(row)
        db.flush()
    
    raw = row.config_data
    print(f"[add_config_item] raw type={type(raw)} value={str(raw)[:100]}", file=sys.stderr)
    data = _parse_config(raw)
    print(f"[add_config_item] parsed data type={type(data)} len={len(data) if isinstance(data,list) else 'N/A'}", file=sys.stderr)
    
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail=f"Config không phải dạng danh sách. Type: {type(data).__name__}")
    
    # Kiểm tra trùng code
    code_field = item.get("code") or item.get("ma") or item.get("loai")
    if code_field:
        for existing in data:
            if existing.get("code") == code_field or existing.get("ma") == code_field:
                raise HTTPException(status_code=400, detail=f"Mã '{code_field}' đã tồn tại!")
    
    data.append(item)
    # QUAN TRỌNG: JSONB cần assign list MỚI để SQLAlchemy detect thay đổi
    # Không thể chỉ mutate list cũ - phải tạo copy mới
    row.config_data = list(data)
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(row, "config_data")
    db.commit()
    db.refresh(row)
    final_data = _parse_config(row.config_data)
    print(f"[add_config_item] SUCCESS, total items={len(final_data)}", file=sys.stderr)
    return {"key": key, "data": final_data, "message": "Đã thêm thành công!"}

@router.delete("/system-config/{key}/remove-item/{idx}", summary="Xóa item theo index")
def remove_config_item(key: str, idx: int, db: Session = Depends(get_db)):
    row = db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy config: {key}")
    data = _parse_config(row.config_data)
    if not isinstance(data, list) or idx >= len(data):
        raise HTTPException(status_code=400, detail="Index không hợp lệ")
    removed = data.pop(idx)
    row.config_data = list(data)
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(row, "config_data")
    db.commit()
    return {"key": key, "data": data, "removed": removed}

# ============================================================
# CRUD ĐƠN VỊ TÍNH - /units
# ============================================================
@router.get("/units", summary="Danh sách đơn vị tính")
def get_units(db: Session = Depends(get_db)):
    return db.query(Unit).filter(Unit.is_active == True).order_by(Unit.code).all()

@router.post("/units", summary="Thêm đơn vị tính", status_code=201)
def create_unit(data: dict, db: Session = Depends(get_db)):
    if db.query(Unit).filter(Unit.code == data.get("code","").upper()).first():
        raise HTTPException(status_code=400, detail=f"Mã ĐVT '{data.get('code')}' đã tồn tại!")
    u = Unit(code=data["code"].upper(), name=data["name"], description=data.get("description",""))
    db.add(u)
    try:
        db.commit(); db.refresh(u); return u
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=400, detail=str(e))

@router.put("/units/{id}", summary="Cập nhật đơn vị tính")
def update_unit(id: int, data: dict, db: Session = Depends(get_db)):
    u = db.query(Unit).filter(Unit.id == id).first()
    if not u: raise HTTPException(status_code=404, detail="Không tìm thấy ĐVT")
    for k in ["name","description","is_active"]:
        if k in data: setattr(u, k, data[k])
    db.commit(); db.refresh(u); return u

@router.delete("/units/{id}", summary="Xóa đơn vị tính")
def delete_unit(id: int, db: Session = Depends(get_db)):
    u = db.query(Unit).filter(Unit.id == id).first()
    if not u: raise HTTPException(status_code=404, detail="Không tìm thấy ĐVT")
    u.is_active = False
    db.commit()
    return {"message": f"Đã xóa ĐVT {u.code}"}


# ============================================================
# NĂM TÀI CHÍNH - dùng system_config key='fiscal_years'
# ============================================================
@router.get("/fiscal-years", summary="Năm tài chính (từ system_config)")
def get_fiscal_years(db: Session = Depends(get_db)):
    row = db.query(SystemConfig).filter(SystemConfig.config_key == "fiscal_years").first()
    if not row: return []
    return _parse_config(row.config_data)

# ============================================================
# NGOẠI TỆ - dùng system_config key='currencies'
# ============================================================
@router.get("/currencies", summary="Ngoại tệ (từ system_config)")
def get_currencies(db: Session = Depends(get_db)):
    row = db.query(SystemConfig).filter(SystemConfig.config_key == "currencies").first()
    if not row: return []
    return _parse_config(row.config_data)