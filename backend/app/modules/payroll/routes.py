"""
Routes cho module Payroll - Nhân viên, Lương, Cấu hình BH
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.modules.payroll.models import Employee, PayrollMaster, PayrollDetail, PayrollConfig
from app.modules.payroll.schemas import (
    EmployeeCreate, EmployeeResponse,
    PayrollCreate, PayrollResponse, PayrollDetailResponse,
    PayrollConfigUpdate, PayrollConfigResponse
)

router = APIRouter(tags=["Lương & BHXH | Payroll"])


# ============ NHÂN VIÊN ============
@router.post("/employees", response_model=EmployeeResponse, status_code=201)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(Employee).filter(Employee.ma_nv == data.ma_nv).first():
        raise HTTPException(400, f"Mã NV '{data.ma_nv}' đã tồn tại")
    
    emp = Employee(
        ma_nv=data.ma_nv,
        ten_nv=data.ten_nv,
        he_so_luong=data.he_so_luong,
        luong_co_ban=data.luong_co_ban,
        chuc_vu=data.chuc_vu,
        phong_ban=data.phong_ban,
        ngay_vao_lam=data.ngay_vao_lam,
        so_tai_khoan=data.so_tai_khoan,
        ngan_hang=data.ngan_hang,
        con_hoat_dong=True
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    
    return EmployeeResponse(
        id=emp.id,
        ma_nv=emp.ma_nv,
        ten_nv=emp.ten_nv,
        he_so_luong=float(emp.he_so_luong),
        luong_co_ban=float(emp.luong_co_ban),
        chuc_vu=emp.chuc_vu,
        phong_ban=emp.phong_ban
    )

@router.get("/employees", response_model=list[EmployeeResponse])
def get_employees(db: Session = Depends(get_db)):
    emps = db.query(Employee).filter(Employee.con_hoat_dong == True).all()
    return [
        EmployeeResponse(
            id=e.id,
            ma_nv=e.ma_nv,
            ten_nv=e.ten_nv,
            he_so_luong=float(e.he_so_luong),
            luong_co_ban=float(e.luong_co_ban),
            chuc_vu=e.chuc_vu,
            phong_ban=e.phong_ban
        ) for e in emps
    ]

@router.get("/employees/{id}", response_model=EmployeeResponse)
def get_employee(id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(404, "Nhân viên không tìm thấy")
    return EmployeeResponse(
        id=emp.id,
        ma_nv=emp.ma_nv,
        ten_nv=emp.ten_nv,
        he_so_luong=float(emp.he_so_luong),
        luong_co_ban=float(emp.luong_co_ban),
        chuc_vu=emp.chuc_vu,
        phong_ban=emp.phong_ban
    )


# ============ CHỨNG TỪ LƯƠNG ============
@router.post("/payroll", response_model=PayrollResponse, status_code=201)
def create_payroll(data: PayrollCreate, db: Session = Depends(get_db)):
    # Kiểm tra trùng số CT
    if db.query(PayrollMaster).filter(
        PayrollMaster.so_chung_tu == data.so_chung_tu,
        PayrollMaster.period_id == data.ky_ke_toan_id
    ).first():
        raise HTTPException(400, f"Số CT '{data.so_chung_tu}' đã tồn tại trong kỳ này")

    if not data.details:
        raise HTTPException(400, "Danh sách nhân viên không được rỗng")

    # Tạo master
    payroll = PayrollMaster(
        so_chung_tu=data.so_chung_tu,
        ngay_chung_tu=data.ngay_chung_tu,
        period_id=data.ky_ke_toan_id,
        dien_giai=data.dien_giai,
        trang_thai="DRAFT"
    )
    db.add(payroll)
    db.flush()

    # Lấy config bảo hiểm
    config = db.query(PayrollConfig).first()
    if not config:
        config = PayrollConfig()
        db.add(config)
        db.flush()

    tong_thu_nhap = 0
    tong_giam_tru = 0

    for detail_data in data.details:
        emp = db.query(Employee).filter(
            Employee.id == detail_data.employee_id
        ).first()
        if not emp:
            raise HTTPException(404, f"Không tìm thấy nhân viên ID={detail_data.employee_id}")

        # Tính tổng thu nhập
        tong_tien = (
            float(detail_data.tien_luong_sp or 0) +
            float(detail_data.luong_thoi_gian or 0) +
            float(detail_data.tien_luong_nghi or 0) +
            float(detail_data.pc_tu_quy_luong or 0) +
            float(detail_data.phu_cap_khac or 0) +
            float(detail_data.tien_thuong or 0)
        )

        # Tính khấu trừ theo lương cơ bản
        luong_cb = float(emp.luong_co_ban or 0)
        tru_bhxh = round(luong_cb * float(config.ty_le_bhxh or 8) / 100)
        tru_bhyt = round(luong_cb * float(config.ty_le_bhyt or 1.5) / 100)
        tru_bhtn = round(luong_cb * float(config.ty_le_bhtn or 1) / 100)
        tong_tru = tru_bhxh + tru_bhyt + tru_bhtn
        thuc_lanh = tong_tien - tong_tru

        detail = PayrollDetail(
            payroll_id=payroll.id,
            employee_id=detail_data.employee_id,
            he_so_luong=emp.he_so_luong,
            so_luong_sp=detail_data.so_luong_sp or 0,
            tien_luong_sp=detail_data.tien_luong_sp or 0,
            so_cong=detail_data.so_cong or 0,
            luong_thoi_gian=detail_data.luong_thoi_gian or 0,
            cong_nghi_tinh_luong=detail_data.cong_nghi_tinh_luong or 0,
            tien_luong_nghi=detail_data.tien_luong_nghi or 0,
            pc_tu_quy_luong=detail_data.pc_tu_quy_luong or 0,
            phu_cap_khac=detail_data.phu_cap_khac or 0,
            tien_thuong=detail_data.tien_thuong or 0,
            tong_tien=tong_tien,
            tru_bhxh=tru_bhxh,
            tru_bhyt=tru_bhyt,
            tru_bhtn=tru_bhtn,
            tru_thue_tncn=0,
            tong_tru=tong_tru,
            thuc_lanh=thuc_lanh
        )
        db.add(detail)
        tong_thu_nhap += tong_tien
        tong_giam_tru += tong_tru

    payroll.tong_thu_nhap = tong_thu_nhap
    payroll.tong_giam_tru = tong_giam_tru
    payroll.tong_thuc_lanh = tong_thu_nhap - tong_giam_tru

    db.commit()
    db.refresh(payroll)

    return PayrollResponse(
        id=payroll.id,
        so_chung_tu=payroll.so_chung_tu,
        ngay_chung_tu=payroll.ngay_chung_tu,
        ky_ke_toan_id=payroll.period_id,
        tong_thu_nhap=float(payroll.tong_thu_nhap),
        tong_giam_tru=float(payroll.tong_giam_tru),
        tong_thuc_lanh=float(payroll.tong_thuc_lanh),
        trang_thai=payroll.trang_thai
    )

@router.get("/payroll", response_model=list[PayrollResponse])
def get_payroll(db: Session = Depends(get_db)):
    payrolls = db.query(PayrollMaster).all()
    return [
        PayrollResponse(
            id=p.id,
            so_chung_tu=p.so_chung_tu,
            ngay_chung_tu=p.ngay_chung_tu,
            ky_ke_toan_id=p.period_id,
            tong_thu_nhap=float(p.tong_thu_nhap),
            tong_giam_tru=float(p.tong_giam_tru),
            tong_thuc_lanh=float(p.tong_thuc_lanh),
            trang_thai=p.trang_thai
        ) for p in payrolls
    ]

@router.get("/payroll/{id}", response_model=PayrollResponse)
def get_payroll_detail(id: int, db: Session = Depends(get_db)):
    payroll = db.query(PayrollMaster).filter(PayrollMaster.id == id).first()
    if not payroll:
        raise HTTPException(404, "Chứng từ lương không tìm thấy")
    return PayrollResponse(
        id=payroll.id,
        so_chung_tu=payroll.so_chung_tu,
        ngay_chung_tu=payroll.ngay_chung_tu,
        ky_ke_toan_id=payroll.period_id,
        tong_thu_nhap=float(payroll.tong_thu_nhap),
        tong_giam_tru=float(payroll.tong_giam_tru),
        tong_thuc_lanh=float(payroll.tong_thuc_lanh),
        trang_thai=payroll.trang_thai
    )


# ============ CẤU HÌNH BẢO HIỂM ============
@router.get("/payroll-config", response_model=PayrollConfigResponse)
def get_payroll_config(db: Session = Depends(get_db)):
    config = db.query(PayrollConfig).first()
    if not config:
        config = PayrollConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    
    return PayrollConfigResponse(
        id=config.id,
        ty_le_bhxh=float(config.ty_le_bhxh),
        ty_le_bhyt=float(config.ty_le_bhyt),
        ty_le_bhtn=float(config.ty_le_bhtn),
        luong_co_so=float(config.luong_co_so),
        giam_tru_gia_canh=float(config.giam_tru_gia_canh),
        giam_tru_phu_thuoc=float(config.giam_tru_phu_thuoc)
    )

@router.put("/payroll-config", response_model=PayrollConfigResponse)
def update_payroll_config(data: PayrollConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(PayrollConfig).first()
    if not config:
        config = PayrollConfig()
    
    config.ty_le_bhxh = data.ty_le_bhxh
    config.ty_le_bhyt = data.ty_le_bhyt
    config.ty_le_bhtn = data.ty_le_bhtn
    config.luong_co_so = data.luong_co_so
    config.giam_tru_gia_canh = data.giam_tru_gia_canh
    config.giam_tru_phu_thuoc = data.giam_tru_phu_thuoc
    
    db.add(config)
    db.commit()
    db.refresh(config)
    
    return PayrollConfigResponse(
        id=config.id,
        ty_le_bhxh=float(config.ty_le_bhxh),
        ty_le_bhyt=float(config.ty_le_bhyt),
        ty_le_bhtn=float(config.ty_le_bhtn),
        luong_co_so=float(config.luong_co_so),
        giam_tru_gia_canh=float(config.giam_tru_gia_canh),
        giam_tru_phu_thuoc=float(config.giam_tru_phu_thuoc)
    )