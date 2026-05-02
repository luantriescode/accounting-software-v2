// Format money with VND currency
export const formatMoney = (value) => {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + ' ₫'
}

// Format number without currency
export const formatNumber = (value) => {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('vi-VN').format(Math.round(value))
}

// Format date to dd/mm/yyyy
export const formatDate = (date) => {
  if (!date) return '-'
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// Format date to yyyy-mm-dd (for input)
export const formatDateForInput = (date) => {
  if (!date) return ''
  if (typeof date === 'string') return date
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// Parse date from yyyy-mm-dd format
export const parseDate = (dateStr) => {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00')
}

// Truncate text
export const truncate = (text, length = 50) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Get status badge color
export const getStatusBadgeClass = (status) => {
  const statusMap = {
    'DRAFT': 'bg-yellow-100 text-yellow-800',
    'POSTED': 'bg-green-100 text-green-800',
    'APPROVED': 'bg-blue-100 text-blue-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'ACTIVE': 'bg-green-100 text-green-800',
    'INACTIVE': 'bg-gray-100 text-gray-800',
  }
  return statusMap[status] || 'bg-gray-100 text-gray-800'
}

// Validation
export const validators = {
  required: (value) => value ? '' : 'Trường này là bắt buộc',
  
  email: (value) => {
    if (!value) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? '' : 'Email không hợp lệ'
  },
  
  phone: (value) => {
    if (!value) return ''
    const phoneRegex = /^[0-9]{9,11}$/
    return phoneRegex.test(value) ? '' : 'Số điện thoại không hợp lệ'
  },
  
  number: (value) => {
    if (!value && value !== 0) return ''
    return !isNaN(value) && value !== '' ? '' : 'Phải là số'
  },
  
  minLength: (min) => (value) => {
    if (!value) return ''
    return value.length >= min ? '' : `Tối thiểu ${min} ký tự`
  },
  
  maxLength: (max) => (value) => {
    if (!value) return ''
    return value.length <= max ? '' : `Tối đa ${max} ký tự`
  },
  
  positive: (value) => {
    if (!value && value !== 0) return ''
    return parseFloat(value) > 0 ? '' : 'Phải lớn hơn 0'
  },
  
  date: (value) => {
    if (!value) return ''
    const date = new Date(value)
    return !isNaN(date) ? '' : 'Ngày không hợp lệ'
  },
}

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Export to CSV
export const exportToCSV = (data, filename = 'export') => {
  if (!Array.isArray(data) || data.length === 0) {
    alert('Không có dữ liệu để xuất')
    return
  }

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        const escaped = typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        return escaped
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

// Export to Excel using xlsx
export const exportToExcel = async (data, filename = 'export') => {
  try {
    const XLSX = await import('xlsx')
    if (!Array.isArray(data) || data.length === 0) {
      alert('Không có dữ liệu để xuất')
      return
    }

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (error) {
    console.error('Export Excel failed:', error)
    alert('Lỗi khi xuất Excel')
  }
}

// Export to PDF using jsPDF
export const exportToPDF = async (htmlElement, filename = 'export') => {
  try {
    const jsPDF = (await import('jspdf')).jsPDF
    const html2canvas = (await import('html2canvas')).default

    const canvas = await html2canvas(htmlElement, { scale: 2 })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210 - 20
    const pageHeight = 295 - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`)
  } catch (error) {
    console.error('Export PDF failed:', error)
    alert('Lỗi khi xuất PDF')
  }
}

// Get error message in Vietnamese
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.detail) return error.detail
  return 'Có lỗi xảy ra, vui lòng thử lại'
}

// Debounce function
export const debounce = (func, delay = 500) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Sleep function
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Check if date is today
export const isToday = (date) => {
  const today = new Date()
  const d = new Date(date)
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
}

// Calculate date difference in days
export const daysDifference = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}