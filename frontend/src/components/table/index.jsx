import React, { useState, useMemo } from 'react'
import { Button } from './ui/index'

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  onRowClick,
  selectable = false,
  pagination = true,
  itemsPerPage = 10,
  actions,
  className = '',
}) => {
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState(new Set())

  // Sort data
  const sortedData = useMemo(() => {
    let sorted = [...data]
    if (sortColumn) {
      sorted.sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    return sorted
  }, [data, sortColumn, sortDirection])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData
    const start = (currentPage - 1) * itemsPerPage
    return sortedData.slice(start, start + itemsPerPage)
  }, [sortedData, currentPage, itemsPerPage, pagination])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  // Handle sort
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Handle row selection
  const toggleRowSelection = (rowIndex) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex)
    } else {
      newSelected.add(rowIndex)
    }
    setSelectedRows(newSelected)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⟳</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        📭 Không có dữ liệu
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b-2 border-gray-200">
          <tr>
            {selectable && (
              <th className="px-4 py-2 text-center w-10">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(data.map((_, i) => i)))
                    } else {
                      setSelectedRows(new Set())
                    }
                  }}
                  checked={selectedRows.size === data.length && data.length > 0}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none ${
                  col.sortable !== false ? '' : 'cursor-default hover:bg-gray-100'
                } ${col.align === 'right' ? 'text-right' : ''}`}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                style={{ width: col.width }}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable !== false && (
                    <span className="text-xs">
                      {sortColumn === col.key && (sortDirection === 'asc' ? '↑' : '↓')}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {actions && <th className="px-4 py-2 w-20">Hành động</th>}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-200 hover:bg-gray-50"
              onClick={() => onRowClick?.(row)}
            >
              {selectable && (
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIndex)}
                    onChange={() => toggleRowSelection(rowIndex)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}
                  style={{ width: col.width }}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          action.onClick?.(row)
                        }}
                        className="text-gray-600 hover:text-blue-600 text-sm"
                        title={action.label}
                      >
                        {action.icon}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
          <div className="text-xs text-gray-600">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedData.length)} trong {sortedData.length} mục
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              ‹‹
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ‹
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              ››
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Filter Bar Component
export const FilterBar = ({ children, className = '' }) => (
  <div className={`flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4 ${className}`}>
    {children}
  </div>
)

// Search Input
export const SearchInput = ({ placeholder = '🔍 Tìm kiếm...', onChange, className = '' }) => (
  <input
    type="text"
    placeholder={placeholder}
    onChange={(e) => onChange?.(e.target.value)}
    className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
  />
)