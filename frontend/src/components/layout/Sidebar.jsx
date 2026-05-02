import React from 'react'
import { useAppStore } from '../../store/appStore'

const Sidebar = ({ onNavigate }) => {
  const { currentPage, expandedMenus, toggleMenu } = useAppStore()

  const navigationMenu = [
    { id: 'dashboard', label: 'Tổng Quan', icon: '🏠', submenu: null },

    {
      id: 'system',
      label: 'Khai Báo Hệ Thống',
      icon: '⚙️',
      submenu: [
        { id: 'sys-company', label: 'Thông Tin Doanh Nghiệp' },
        { id: 'sys-fiscal', label: 'Khai Báo Năm Tài Chính' },
        { id: 'sys-currency', label: 'Danh Mục Ngoại Tệ' },
        { id: 'sys-doctype', label: 'Khai Báo Mẫu Chứng Từ' },
        { id: 'sys-params', label: 'Thiết Lập Tham Số' },
        { id: 'sys-renum', label: 'Đánh Lại Số Chứng Từ' },
        { id: 'sys-repost', label: 'Ghi Lại Chứng Từ' },
        { id: 'sys-users', label: 'Danh Sách Người Dùng' },
      ],
    },

    {
      id: 'catalog',
      label: 'Danh Mục',
      icon: '📋',
      submenu: [
        { id: 'dm-customers', label: 'Khách Hàng' },
        { id: 'dm-suppliers', label: 'Nhà Cung Cấp' },
        { id: 'dm-products', label: 'Vật Tư / Hàng Hóa' },
        { id: 'dm-warehouse', label: 'Danh Mục Kho' },
        { id: 'dm-unit', label: 'Đơn Vị Tính' },
        { id: 'dm-product-group', label: 'Nhóm Vật Tư Hàng Hóa' },
        { id: 'dm-price', label: 'Danh Mục Giá Bán' },
        { id: 'dm-fund', label: 'Danh Mục Quỹ' },
        { id: 'dm-costitem', label: 'Khoản Mục Phí' },
        { id: 'dm-taxgroup', label: 'Nhóm Ngành Tính Thuế' },
        { id: 'dm-invoice-template', label: 'Mẫu Hóa Đơn' },
        { id: 'dm-lot', label: 'Danh Mục Lô' },
        { id: 'dm-contract', label: 'Danh Mục Hợp Đồng' },
        { id: 'dm-bom', label: 'Định Mức Thành Phẩm' },
        { id: 'dm-employees', label: 'Nhân Viên' },
        { id: 'dm-accounts', label: 'Tài Khoản Kế Toán' },
        { id: 'dm-periods', label: 'Kỳ Kế Toán' },
      ],
    },

    {
      id: 'opening',
      label: 'Số Dư',
      icon: '💰',
      submenu: [
        { id: 'ob-inventory', label: 'Tồn Kho Vật Tư HH' },
        { id: 'ob-fund', label: 'Số Dư Quỹ' },
        { id: 'ob-tax', label: 'Nghĩa Vụ Thuế NSNN' },
        { id: 'ob-payroll', label: 'Lương - Bảo Hiểm' },
        { id: 'ob-debt', label: 'Công Nợ' },
        { id: 'ob-transfer-stock', label: 'Chuyển Tồn Kho Sang Năm' },
        { id: 'ob-transfer-balance', label: 'Chuyển Số Dư Sang Năm' },
      ],
    },

    {
      id: 'operations',
      label: 'Nghiệp Vụ',
      icon: '📊',
      submenu: [
        { id: 'nv-pt', label: 'Phiếu Thu' },
        { id: 'nv-pc', label: 'Phiếu Chi' },
        { id: 'nv-ttg', label: 'Báo Có - Thu Tiền Gửi' },
        { id: 'nv-ctg', label: 'Báo Nợ - Chi Tiền Gửi' },
        { id: 'nv-pnm', label: 'Phiếu Nhập Mua' },
        { id: 'nv-pbh', label: 'Phiếu Bán Hàng' },
        { id: 'nv-bl', label: 'Phiếu Bán Lẻ' },
        { id: 'nv-pnk', label: 'Phiếu Nhập Kho' },
        { id: 'nv-pxk', label: 'Phiếu Xuất Kho' },
        { id: 'nv-htk', label: 'Tính Giá Tồn Kho' },
        { id: 'nv-payroll', label: 'Thanh Toán Lương' },
        { id: 'nv-payroll-config', label: 'Cấu Hình Bảo Hiểm' },
      ],
    },

    {
      id: 'reports',
      label: 'Báo Cáo',
      icon: '📈',
      submenu: [
        { id: 'rpt-tonkho', label: 'Báo Cáo Tồn Kho HTK' },
        { id: 'rpt-nhapxuat', label: 'Nhập Xuất Tồn' },
        { id: 'rpt-bank', label: 'Số Dư TK NH' },
        { id: 'rpt-ttg-ctg', label: 'Sổ TTG / CTG' },
        { id: 'rpt-payroll', label: 'Bảng Lương' },
        { id: 'rpt-debt', label: 'Báo Cáo Công Nợ' },
      ],
    },
  ]

  return (
    <aside className="fixed left-0 top-0 w-[260px] h-screen bg-slate-900 flex flex-col overflow-hidden z-50">
      {/* Logo */}
      <div className="h-[52px] px-4 flex items-center gap-3 border-b border-slate-700 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-base flex-shrink-0">
          📊
        </div>
        <div>
          <div className="text-white text-xs font-bold leading-tight">KẾ TOÁN HKD</div>
          <div className="text-slate-400 text-[10px] leading-tight">V2.0 | Hộ Kinh Doanh</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {navigationMenu.map((menu) => (
          <div key={menu.id} className="mb-0.5">
            {/* Level 1 */}
            <button
              onClick={() => {
                if (!menu.submenu) {
                  onNavigate(menu.id)
                } else {
                  toggleMenu(menu.id)
                }
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 mx-1 rounded-md text-[13px] font-medium transition-all duration-150 ${
                currentPage === menu.id
                  ? 'bg-blue-600 text-white'
                  : expandedMenus[menu.id]
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              style={{ width: 'calc(100% - 8px)' }}
            >
              <span className="text-base w-5 text-center flex-shrink-0">{menu.icon}</span>
              <span className="flex-1 text-left truncate">{menu.label}</span>
              {menu.submenu && (
                <span
                  className={`text-slate-400 text-xs transition-transform duration-200 ${
                    expandedMenus[menu.id] ? 'rotate-90' : ''
                  }`}
                >
                  ›
                </span>
              )}
            </button>

            {/* Level 2 */}
            {menu.submenu && expandedMenus[menu.id] && (
              <div className="ml-4 pl-3 border-l border-slate-700 mt-0.5 mb-1">
                {menu.submenu.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onNavigate(sub.id)}
                    className={`w-full text-left px-3 py-1.5 rounded text-[12px] transition-all duration-100 block mb-0.5 ${
                      currentPage === sub.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700 flex-shrink-0">
        <div className="text-center text-[10px] text-slate-500">
          © 2026 HKD Accounting Software
        </div>
      </div>
    </aside>
  )
}

export default Sidebar