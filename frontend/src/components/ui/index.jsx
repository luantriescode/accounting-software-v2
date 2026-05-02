import React, { useState } from 'react'

// Card Component
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
)

// Card Header
export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-4 py-3 border-b border-gray-200 flex items-center justify-between ${className}`}>
    {children}
  </div>
)

// Card Body
export const CardBody = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
)

// Card Footer
export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 rounded-b-lg ${className}`}>
    {children}
  </div>
)

// Button Component
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const variantClass = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    excel: 'bg-green-700 text-white hover:bg-green-800',
    pdf: 'bg-red-700 text-white hover:bg-red-800',
  }

  const sizeClass = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  }

  return (
    <button
      className={`rounded font-semibold transition-colors flex items-center gap-2 ${variantClass[variant]} ${sizeClass[size]} disabled:cursor-not-allowed ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// Badge Component
export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variantClass = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    primary: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClass[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Alert Component
export const Alert = ({ children, variant = 'info', onClose, className = '' }) => {
  const variantClass = {
    success: 'bg-green-50 text-green-800 border-green-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  }

  return (
    <div className={`border rounded-lg p-3 flex items-start justify-between gap-3 ${variantClass[variant]} ${className}`}>
      <div className="text-sm">{children}</div>
      {onClose && (
        <button onClick={onClose} className="text-lg leading-none opacity-50 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  )
}

// Modal Component
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-lg ${sizeClass[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Tabs Component
export const Tabs = ({ tabs, defaultTab = 0, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (index) => {
    setActiveTab(index)
    onChange?.(index)
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(index)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-[2px] ${
              activeTab === index
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {tabs[activeTab]?.content}
      </div>
    </div>
  )
}

// Stat Card Component
export const StatCard = ({ icon, label, value, color = 'blue' }) => {
  const colorClass = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    yellow: 'bg-yellow-50',
  }

  return (
    <Card className={colorClass[color]}>
      <CardBody className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg bg-${color}-200 flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-600 font-medium">{label}</div>
          <div className="text-lg font-bold text-gray-900">{value}</div>
        </div>
      </CardBody>
    </Card>
  )
}

// Loading Spinner
export const Spinner = ({ size = 'md' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`${sizeClass[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
  )
}

// Empty State
export const EmptyState = ({ icon = '📭', title = 'Không có dữ liệu', message = '' }) => (
  <div className="text-center py-12">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
    {message && <p className="text-sm text-gray-600">{message}</p>}
  </div>
)

// Skeleton loader
export const Skeleton = ({ className = '' }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
)

// Loading state
export const LoadingTable = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array(rows).fill(0).map((_, i) => (
      <Skeleton key={i} className="h-12" />
    ))}
  </div>
)