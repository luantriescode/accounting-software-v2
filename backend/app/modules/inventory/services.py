"""
Services cho module Inventory - Logic tính giá AVG + FIFO
"""
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from decimal import Decimal

from app.modules.warehouse.models import (
    WarehouseReceipt, WarehouseReceiptItem,
    WarehouseIssue, WarehouseIssueItem
)
from app.modules.catalog.models import Product, Warehouse
from app.modules.inventory.models import (
    InventoryValuationResult, InventoryValuationConfig
)


class InventoryValuationService:
    """Service tính giá HTK"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_avg_valuation(self, product_id: int, warehouse_id: int, 
                               period_from: date, period_to: date):
        """
        Tính giá bình quân (AVG)
        Công thức: Đơn giá = (Tồn đầu kỳ + Nhập trong kỳ) / (Tồn đầu kỳ SL + Nhập trong kỳ SL)
        """
        
        # Lấy tồn đầu kỳ từ stock_summaries hoặc từ kỳ trước
        opening = self._get_opening_balance(product_id, warehouse_id, period_from)
        opening_qty = float(opening['qty'] or 0)
        opening_value = float(opening['value'] or 0)
        
        # Nhập trong kỳ từ phiếu nhập kho
        import_data = self._get_import_data(product_id, warehouse_id, period_from, period_to)
        import_qty = float(import_data['qty'] or 0)
        import_value = float(import_data['value'] or 0)
        
        # Xuất trong kỳ từ phiếu xuất kho
        export_data = self._get_export_data(product_id, warehouse_id, period_from, period_to)
        export_qty = float(export_data['qty'] or 0)
        export_value = float(export_data['value'] or 0)
        
        # Tồn cuối kỳ
        closing_qty = opening_qty + import_qty - export_qty
        
        # Tính đơn giá bình quân
        total_available_qty = opening_qty + import_qty
        if total_available_qty > 0:
            avg_unit_price = (opening_value + import_value) / total_available_qty
        else:
            avg_unit_price = 0
        
        # Giá trị tồn cuối kỳ theo bình quân
        closing_value = closing_qty * avg_unit_price
        
        # Giá trị xuất theo bình quân (tính lại để đúng)
        export_value = export_qty * avg_unit_price
        
        return {
            'opening_qty': opening_qty,
            'opening_value': opening_value,
            'import_qty': import_qty,
            'import_value': import_value,
            'export_qty': export_qty,
            'export_value': export_value,
            'closing_qty': closing_qty,
            'closing_value': closing_value,
            'unit_price': avg_unit_price
        }
    
    def calculate_fifo_valuation(self, product_id: int, warehouse_id: int,
                                period_from: date, period_to: date):
        """
        Tính giá FIFO (Nhập trước xuất trước)
        Xuất hàng dùng giá từ lô hàng cũ nhất
        """
        
        # Lấy tồn đầu kỳ
        opening = self._get_opening_balance(product_id, warehouse_id, period_from)
        opening_qty = float(opening['qty'] or 0)
        opening_value = float(opening['value'] or 0)
        opening_unit_price = opening_value / opening_qty if opening_qty > 0 else 0
        
        # Lấy danh sách phiếu nhập và xuất theo thứ tự thời gian
        receipts = self.db.query(WarehouseReceiptItem).join(
            WarehouseReceipt
        ).filter(
            and_(
                WarehouseReceiptItem.product_id == product_id,
                WarehouseReceiptItem.warehouse_id == warehouse_id,
                WarehouseReceipt.ngay_phieu_nhap >= period_from,
                WarehouseReceipt.ngay_phieu_nhap <= period_to
            )
        ).all()
        
        issues = self.db.query(WarehouseIssueItem).join(
            WarehouseIssue
        ).filter(
            and_(
                WarehouseIssueItem.product_id == product_id,
                WarehouseIssueItem.warehouse_id == warehouse_id,
                WarehouseIssue.ngay_phieu_xuat >= period_from,
                WarehouseIssue.ngay_phieu_xuat <= period_to
            )
        ).all()
        
        # Tổng nhập
        import_qty = sum(r.quantity for r in receipts)
        import_value = sum(float(r.quantity * r.unit_price) for r in receipts)
        
        # Tổng xuất
        export_qty = sum(i.quantity for i in issues)
        
        # Giá trị xuất theo FIFO (cần tính chi tiết từng lô)
        export_value = self._calculate_fifo_export_value(
            opening_qty, opening_unit_price,
            receipts, issues
        )
        
        # Tồn cuối kỳ
        closing_qty = opening_qty + import_qty - export_qty
        closing_value = opening_value + import_value - export_value
        
        # Đơn giá cuối kỳ
        unit_price = closing_value / closing_qty if closing_qty > 0 else 0
        
        return {
            'opening_qty': opening_qty,
            'opening_value': opening_value,
            'import_qty': import_qty,
            'import_value': import_value,
            'export_qty': export_qty,
            'export_value': export_value,
            'closing_qty': closing_qty,
            'closing_value': closing_value,
            'unit_price': unit_price
        }
    
    def _get_opening_balance(self, product_id: int, warehouse_id: int, period_from: date):
        """Lấy tồn đầu kỳ từ stock_summaries kỳ trước"""
        from app.modules.warehouse.models import StockSummary
        
        # Lấy kỳ trước
        previous_summary = self.db.query(StockSummary).filter(
            and_(
                StockSummary.product_id == product_id,
                StockSummary.warehouse_id == warehouse_id
            )
        ).order_by(StockSummary.period_id.desc()).first()
        
        if previous_summary:
            return {
                'qty': previous_summary.ton_cuoi_ky_sl,
                'value': previous_summary.ton_cuoi_ky_gia_tri
            }
        
        return {'qty': 0, 'value': 0}
    
    def _get_import_data(self, product_id: int, warehouse_id: int,
                        period_from: date, period_to: date):
        """Lấy dữ liệu nhập trong kỳ"""
        items = self.db.query(WarehouseReceiptItem).join(
            WarehouseReceipt
        ).filter(
            and_(
                WarehouseReceiptItem.product_id == product_id,
                WarehouseReceiptItem.warehouse_id == warehouse_id,
                WarehouseReceipt.ngay_phieu_nhap >= period_from,
                WarehouseReceipt.ngay_phieu_nhap <= period_to
            )
        ).all()
        
        total_qty = sum(i.quantity for i in items)
        total_value = sum(float(i.quantity * i.unit_price) for i in items)
        
        return {'qty': total_qty, 'value': total_value}
    
    def _get_export_data(self, product_id: int, warehouse_id: int,
                        period_from: date, period_to: date):
        """Lấy dữ liệu xuất trong kỳ"""
        items = self.db.query(WarehouseIssueItem).join(
            WarehouseIssue
        ).filter(
            and_(
                WarehouseIssueItem.product_id == product_id,
                WarehouseIssueItem.warehouse_id == warehouse_id,
                WarehouseIssue.ngay_phieu_xuat >= period_from,
                WarehouseIssue.ngay_phieu_xuat <= period_to
            )
        ).all()
        
        total_qty = sum(i.quantity for i in items)
        # Tạm dùng unit_price từ phiếu xuất (sẽ tính lại theo phương pháp)
        total_value = sum(float(i.quantity * i.unit_price) for i in items)
        
        return {'qty': total_qty, 'value': total_value}
    
    def _calculate_fifo_export_value(self, opening_qty: float, opening_unit_price: float,
                                    receipts, issues):
        """Tính giá trị xuất theo FIFO - chi tiết từng lô"""
        # Simplified version: dùng tồn đầu kỳ giá rồi mới đến hàng nhập
        queue = []
        
        # Thêm tồn đầu kỳ vào queue
        if opening_qty > 0:
            queue.append({'qty': opening_qty, 'price': opening_unit_price})
        
        # Thêm hàng nhập vào queue theo thứ tự
        for receipt in receipts:
            queue.append({'qty': receipt.quantity, 'price': float(receipt.unit_price)})
        
        # Xuất hàng theo FIFO
        export_value = 0
        remaining_to_export = sum(i.quantity for i in issues)
        
        while queue and remaining_to_export > 0:
            lot = queue.pop(0)
            if lot['qty'] <= remaining_to_export:
                export_value += lot['qty'] * lot['price']
                remaining_to_export -= lot['qty']
            else:
                export_value += remaining_to_export * lot['price']
                remaining_to_export = 0
        
        return export_value