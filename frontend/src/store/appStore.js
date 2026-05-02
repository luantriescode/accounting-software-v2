import { create } from 'zustand'

// App store - navigation, UI state
export const useAppStore = create((set) => ({
  // Navigation
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  
  // Sidebar
  expandedMenus: {},
  toggleMenu: (menuId) => set((state) => ({
    expandedMenus: {
      ...state.expandedMenus,
      [menuId]: !state.expandedMenus[menuId],
    },
  })),
  
  // Alert/Toast
  alerts: [],
  addAlert: (message, type = 'success', duration = 4000) => set((state) => {
    const id = Date.now()
    const newAlerts = [...state.alerts, { id, message, type }]
    setTimeout(() => {
      set({ alerts: state.alerts.filter(a => a.id !== id) })
    }, duration)
    return { alerts: newAlerts }
  }),
  removeAlert: (id) => set((state) => ({
    alerts: state.alerts.filter(a => a.id !== id),
  })),
  
  // Period selector
  currentPeriod: { id: 1, name: 'Tháng 4/2026' },
  setCurrentPeriod: (period) => set({ currentPeriod: period }),
  
  // Loading state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))

// Data store - cached data
export const useDataStore = create((set) => ({
  // Catalog
  customers: [],
  setCustomers: (data) => set({ customers: data }),
  
  suppliers: [],
  setSuppliers: (data) => set({ suppliers: data }),
  
  products: [],
  setProducts: (data) => set({ products: data }),
  
  warehouses: [],
  setWarehouses: (data) => set({ warehouses: data }),
  
  funds: [],
  setFunds: (data) => set({ funds: data }),
  
  // Documents
  receipts: [],
  setReceipts: (data) => set({ receipts: data }),
  
  payments: [],
  setPayments: (data) => set({ payments: data }),
  
  bankTransactions: [],
  setBankTransactions: (data) => set({ bankTransactions: data }),
  
  // Filters
  filters: {
    dateFrom: new Date(2026, 3, 1),
    dateTo: new Date(2026, 3, 30),
    search: '',
    status: '',
  },
  setFilters: (filters) => set({ filters }),
  setDateFrom: (date) => set((state) => ({
    filters: { ...state.filters, dateFrom: date },
  })),
  setDateTo: (date) => set((state) => ({
    filters: { ...state.filters, dateTo: date },
  })),
  setSearch: (search) => set((state) => ({
    filters: { ...state.filters, search },
  })),
}))

// Form state
export const useFormStore = create((set) => ({
  formData: {},
  setFormData: (data) => set({ formData: data }),
  updateFormField: (field, value) => set((state) => ({
    formData: { ...state.formData, [field]: value },
  })),
  clearForm: () => set({ formData: {} }),
  
  isSubmitting: false,
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  
  errors: {},
  setErrors: (errors) => set({ errors }),
  addError: (field, message) => set((state) => ({
    errors: { ...state.errors, [field]: message },
  })),
  clearErrors: () => set({ errors: {} }),
}))

// Auth store
export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('auth_token') || null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('auth_token', token)
    set({ token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('auth_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))