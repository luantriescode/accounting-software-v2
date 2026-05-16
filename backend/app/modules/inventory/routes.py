"""
Routes cho module Inventory - Tính giá HTK + Báo cáo (FIXED)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from app.database import get_db
from app.modules.inventory.models import InventoryValuationResult, InventoryValuationConfig
from app.modules.inventory.schemas import (
    InventoryValuationRequest, InventoryValuationResponse, InventoryValuationDetailResponse,
    InventoryReport, InventoryReportRow
)
from app.modules.inventory.services import InventoryValuationService
from app.modules.catalog.models import Product, Warehouse
from app.modules.warehouse.models import StockSummary

router = APIRouter(tags=["HTK | Inventory Valuation"])


# ============ TÍNH GIÁ HTK ============
@router.post("/inventory/tinh-gia-htk", response_model=InventoryValuationResponse, status_code=200)
def calculate_inventory_valuation(
    request: InventoryValuationRequest,
    db: Session = Depends(get_db)
):
    """
    Tính giá HTK theo phương pháp AVG hoặc FIFO
    
    Request:
    {
        "period_from": "2026-04-01",
        "period_to": "2026-04-30",
        "warehouse_id": null,  // null = tất cả kho
        "product_id": null,    // null = tất cả sản phẩm
        "valuation_method": "AVG",  // AVG hoặc FIFO
        "group_by": "product"  // product, warehouse, hoặc both
    }
    """
    
    service = InventoryValuationService(db)
    
    # Lấy danh sách sản phẩm + kho
    products = db.query(Product).filter(Product.is_active == True).all()
    warehouses = db.query(Warehouse).filter(Warehouse.is_active == True).all()
    
    if request.product_id:
        products = [p for p in products if p.id == request.product_id]
    if request.warehouse_id:
        warehouses = [w for w in warehouses if w.id == request.warehouse_id]
    
    # Tính giá cho từng sản phẩm + kho
    details = []
    total_opening_qty = 0
    total_opening_value = 0
    total_import_qty = 0
    total_import_value = 0
    total_export_qty = 0
    total_export_value = 0
    total_closing_qty = 0
    total_closing_value = 0
    
    for product in products:
        for warehouse in warehouses:
            # Tính giá
            if request.valuation_method == "AVG":
                result = service.calculate_avg_valuation(
                    product.id, warehouse.id,
                    request.period_from, request.period_to
                )
            else:  # FIFO
                result = service.calculate_fifo_valuation(
                    product.id, warehouse.id,
                    request.period_from, request.period_to
                )
            
            # Thêm vào database
            valuation_result = InventoryValuationResult(
                period_from=request.period_from,
                period_to=request.period_to,
                warehouse_id=warehouse.id,
                product_id=product.id,
                valuation_method=request.valuation_method,
                opening_qty=result['opening_qty'],
                opening_value=result['opening_value'],
                import_qty=result['import_qty'],
                import_value=result['import_value'],
                export_qty=result['export_qty'],
                export_value=result['export_value'],
                closing_qty=result['closing_qty'],
                closing_value=result['closing_value'],
                unit_price=result['unit_price']
            )
            db.add(valuation_result)
            
            # Thêm vào detail response
            detail = InventoryValuationDetailResponse(
                product_id=product.id,
                product_code=product.code,
                product_name=product.name,
                warehouse_id=warehouse.id,
                warehouse_name=warehouse.name,
                opening_qty=result['opening_qty'],
                opening_value=result['opening_value'],
                import_qty=result['import_qty'],
                import_value=result['import_value'],
                export_qty=result['export_qty'],
                export_value=result['export_value'],
                closing_qty=result['closing_qty'],
                closing_value=result['closing_value'],
                unit_price=result['unit_price'],
                valuation_method=request.valuation_method
            )
            details.append(detail)
            
            # Cộng vào tổng
            total_opening_qty += result['opening_qty']
            total_opening_value += result['opening_value']
            total_import_qty += result['import_qty']
            total_import_value += result['import_value']
            total_export_qty += result['export_qty']
            total_export_value += result['export_value']
            total_closing_qty += result['closing_qty']
            total_closing_value += result['closing_value']
    
    db.commit()
    
    return InventoryValuationResponse(
        period_from=request.period_from,
        period_to=request.period_to,
        valuation_method=request.valuation_method,
        total_opening_qty=total_opening_qty,
        total_opening_value=total_opening_value,
        total_import_qty=total_import_qty,
        total_import_value=total_import_value,
        total_export_qty=total_export_qty,
        total_export_value=total_export_value,
        total_closing_qty=total_closing_qty,
        total_closing_value=total_closing_value,
        details=details
    )
@router.get("/inventory/gia-von")
def get_gia_von(
    period_id: int = Query(..., description="ID kỳ kế toán"),
    db: Session = Depends(get_db)
):
    from app.modules.catalog.models import FiscalPeriod
    
    # Lấy kỳ kế toán
    ky = db.query(FiscalPeriod).filter(FiscalPeriod.id == period_id).first()
    if not ky:
        raise HTTPException(404, f"Không tìm thấy kỳ kế toán id={period_id}")
    
    start_date = ky.start_date
    
    # Lấy tất cả sản phẩm active
    products = db.query(Product).filter(Product.is_active == True).all()
    
    result = []
    for product in products:
        # Tìm kết quả HTK bao phủ kỳ này, lấy mới nhất
        row = db.query(InventoryValuationResult).filter(
            InventoryValuationResult.product_id == product.id,
            InventoryValuationResult.period_from <= start_date,
            InventoryValuationResult.period_to >= start_date,
        ).order_by(InventoryValuationResult.calculated_at.desc()).first()
        
        if row and float(row.unit_price) > 0:
            result.append({
                "product_id": product.id,
                "unit_price": float(row.unit_price),
                "valuation_method": row.valuation_method,
                "calculated_at": str(row.calculated_at)
            })
        else:
            # Fallback: lấy kỳ gần nhất có giá > 0
            fallback = db.query(InventoryValuationResult).filter(
                InventoryValuationResult.product_id == product.id,
                InventoryValuationResult.unit_price > 0,
            ).order_by(InventoryValuationResult.calculated_at.desc()).first()
            
            result.append({
                "product_id": product.id,
                "unit_price": float(fallback.unit_price) if fallback else 0,
                "valuation_method": fallback.valuation_method if fallback else "AVG",
                "calculated_at": str(fallback.calculated_at) if fallback else None
            })
    
    return result

# ============ BÁO CÁO TỒN KHO ============
@router.get("/inventory/bao-cao-ton-kho", response_model=InventoryReport, status_code=200)
def generate_inventory_report(
    period_from: str = Query(..., description="Từ ngày (YYYY-MM-DD)"),
    period_to: str = Query(..., description="Đến ngày (YYYY-MM-DD)"),
    warehouse_id: int = Query(None, description="Mã kho (null = tất cả)"),
    product_id: int = Query(None, description="Mã SP (null = tất cả)"),
    valuation_method: str = Query("AVG", description="AVG hoặc FIFO"),
    db: Session = Depends(get_db)
):
    """
    Xuất báo cáo tồn kho
    
    Query:
    /inventory/bao-cao-ton-kho?period_from=2026-04-29&period_to=2026-04-30&valuation_method=AVG
    
    FIX: Sử dụng >= và <= để tìm tất cả dữ liệu trong range
    """
    
    from datetime import datetime as dt
    period_from_date = dt.strptime(period_from, "%Y-%m-%d").date()
    period_to_date = dt.strptime(period_to, "%Y-%m-%d").date()
    
    # FIX: Dùng >= và <= thay vì ==
    # Lấy tất cả kết quả có period_from >= input_from và period_to <= input_to
    filters = [
        InventoryValuationResult.period_from >= period_from_date,
        InventoryValuationResult.period_to <= period_to_date,
        InventoryValuationResult.valuation_method == valuation_method
    ]
    
    if warehouse_id:
        filters.append(InventoryValuationResult.warehouse_id == warehouse_id)
    if product_id:
        filters.append(InventoryValuationResult.product_id == product_id)
    
    results = db.query(InventoryValuationResult).filter(and_(*filters)).all()
    
    if not results:
        raise HTTPException(404, f"Không tìm thấy dữ liệu từ {period_from} đến {period_to}")
    
    # Tạo báo cáo
    rows = []
    total_opening_qty = 0
    total_opening_value = 0
    total_import_qty = 0
    total_import_value = 0
    total_export_qty = 0
    total_export_value = 0
    total_closing_qty = 0
    total_closing_value = 0
    
    for result in results:
        product = db.query(Product).filter(Product.id == result.product_id).first()
        warehouse = db.query(Warehouse).filter(Warehouse.id == result.warehouse_id).first()
        
        row = InventoryReportRow(
            product_code=product.code if product else "",
            product_name=product.name if product else "",
            warehouse_name=warehouse.name if warehouse else "",
            unit=product.unit if product else "",
            ton_dau_ky_sl=float(result.opening_qty),
            ton_dau_ky_gia_tri=float(result.opening_value),
            nhap_trong_ky_sl=float(result.import_qty),
            nhap_trong_ky_gia_tri=float(result.import_value),
            xuat_trong_ky_sl=float(result.export_qty),
            xuat_trong_ky_gia_tri=float(result.export_value),
            ton_cuoi_ky_sl=float(result.closing_qty),
            ton_cuoi_ky_gia_tri=float(result.closing_value),
            don_gia=float(result.unit_price)
        )
        rows.append(row)
        
        # Cộng tổng
        total_opening_qty += float(result.opening_qty)
        total_opening_value += float(result.opening_value)
        total_import_qty += float(result.import_qty)
        total_import_value += float(result.import_value)
        total_export_qty += float(result.export_qty)
        total_export_value += float(result.export_value)
        total_closing_qty += float(result.closing_qty)
        total_closing_value += float(result.closing_value)
    
    report = InventoryReport(
        report_title=f"BÁO CÁO TỒN KHO ({valuation_method}) từ {period_from} đến {period_to}",
        period_from=period_from_date,
        period_to=period_to_date,
        valuation_method=valuation_method,
        generated_at=datetime.now().isoformat(),
        rows=rows,
        total_opening_qty=total_opening_qty,
        total_opening_value=total_opening_value,
        total_import_qty=total_import_qty,
        total_import_value=total_import_value,
        total_export_qty=total_export_qty,
        total_export_value=total_export_value,
        total_closing_qty=total_closing_qty,
        total_closing_value=total_closing_value
    )
    
    return report