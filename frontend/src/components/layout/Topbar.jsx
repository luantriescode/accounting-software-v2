import React from 'react'
import { useAppStore } from '../../store/appStore'

const Topbar = ({ breadcrumbs = [] }) => {
  const { currentPeriod, setCurrentPeriod } = useAppStore()

  const periods = [
    { id: 1, name: 'Tháng 4/2026' },
    { id: 2, name: 'Tháng 3/2026' },
    { id: 3, name: 'Tháng 2/2026' },
    { id: 4, name: 'Tháng 1/2026' },
  ]

  return (
    <div className="fixed top-0 left-[260px] right-0 h-[52px] bg-white border-b border-gray-200 flex items-center px-5 gap-3 z-40">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-gray-500">Trang Chủ</span>
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <span className="text-gray-300">/</span>
            {i === breadcrumbs.length - 1 ? (
              <span className="font-semibold text-gray-900">{crumb.label}</span>
            ) : (
              <span className="text-gray-500">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-3">
        <select
          value={currentPeriod.id}
          onChange={(e) => {
            const p = periods.find(x => x.id == e.target.value)
            if (p) setCurrentPeriod(p)
          }}
          className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 cursor-pointer outline-none"
        >
          {periods.map(p => (
            <option key={p.id} value={p.id}>📅 {p.name}</option>
          ))}
        </select>

        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-blue-600">
          A
        </div>
      </div>
    </div>
  )
}

export default Topbar