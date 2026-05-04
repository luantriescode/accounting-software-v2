import axios from 'axios'

//const API_BASE_URL = 'http://192.168.1.3:8002'
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Lỗi server'
    return Promise.reject({ message, status: error.response?.status })
  }
)

export default apiClient

// Service functions
export const catalogService = {
  getCustomers: () => apiClient.get('/customers'),
  getSuppliers: () => apiClient.get('/suppliers'),
  getProducts: () => apiClient.get('/products'),
  getWarehouses: () => apiClient.get('/warehouses'),
  getUnits: () => apiClient.get('/units'),
  getFunds: () => apiClient.get('/banking/accounts'),
  getCostItems: () => apiClient.get('/cost-items'),
  
  createCustomer: (data) => apiClient.post('/customers', data),
  createSupplier: (data) => apiClient.post('/suppliers', data),
  createProduct: (data) => apiClient.post('/products', data),
  
  updateCustomer: (id, data) => apiClient.put(`/customers/${id}`, data),
  updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
  
  deleteCustomer: (id) => apiClient.delete(`/customers/${id}`),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
}

export const documentService = {
  getPhieuThu: () => apiClient.get('/documents/phieu-thu'),
  getPhieuChi: () => apiClient.get('/documents/phieu-chi'),
  getBaoCo: () => apiClient.get('/documents/bao-co'),
  getBaoNo: () => apiClient.get('/documents/bao-no'),
  getPhieuNhapMua: () => apiClient.get('/documents/phieu-nhap-mua'),
  getPhieuBanHang: () => apiClient.get('/documents/phieu-ban-hang'),
  getPhieuBanLe: () => apiClient.get('/documents/phieu-ban-le'),
  
  createPhieuThu: (data) => apiClient.post('/documents/phieu-thu', data),
  createPhieuChi: (data) => apiClient.post('/documents/phieu-chi', data),
  createPhieuNhapMua: (data) => apiClient.post('/documents/phieu-nhap-mua', data),
}

export const bankingService = {
  getAccounts: () => apiClient.get('/banking/accounts'),
  getTTG: () => apiClient.get('/banking/ttg'),
  getCTG: () => apiClient.get('/banking/ctg'),
  getBankReport: (periodId) => apiClient.get(`/banking/bao-cao-so-du?period_id=${periodId}`),
  getReceiptTypes: () => apiClient.get('/banking/loai-giao-dich-thu'),
  getPaymentTypes: () => apiClient.get('/banking/loai-giao-dich-chi'),
  
  createTTG: (data) => apiClient.post('/banking/ttg', data),
  createCTG: (data) => apiClient.post('/banking/ctg', data),
}

export const warehouseService = {
  getPhieuNhapKho: () => apiClient.get('/documents/phieu-nhap-kho'),
  getPhieuXuatKho: () => apiClient.get('/documents/phieu-xuat-kho'),
  getStockSummary: (periodId) => apiClient.get(`/stock-summary?period_id=${periodId}`),
  getCostItems: () => apiClient.get('/cost-items'),
}

export const inventoryService = {
  calculateHTK: (data) => apiClient.post('/inventory/tinh-gia-htk', data),
  getInventoryReport: (params) => apiClient.get('/inventory/bao-cao-ton-kho', { params }),
}

export const payrollService = {
  getEmployees: () => apiClient.get('/employees'),
  getPayroll: () => apiClient.get('/payroll'),
  getPayrollConfig: () => apiClient.get('/payroll-config'),
  
  updatePayrollConfig: (data) => apiClient.put('/payroll-config', data),
}