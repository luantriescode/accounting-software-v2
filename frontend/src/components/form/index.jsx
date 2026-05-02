import React from 'react'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// Form Group Component
export const FormGroup = ({
  label,
  required = false,
  error,
  children,
  className = '',
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && (
      <label className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
    )}
    {children}
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
)

// Text Input Component
export const TextInput = React.forwardRef(({
  label,
  required,
  error,
  type = 'text',
  placeholder,
  className = '',
  ...props
}, ref) => (
  <FormGroup label={label} required={required} error={error}>
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        error ? 'border-red-500' : ''
      } ${className}`}
      {...props}
    />
  </FormGroup>
))
TextInput.displayName = 'TextInput'

// Number Input Component
export const NumberInput = React.forwardRef(({
  label,
  required,
  error,
  placeholder,
  min,
  max,
  step = 1,
  className = '',
  ...props
}, ref) => (
  <FormGroup label={label} required={required} error={error}>
    <input
      ref={ref}
      type="number"
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-mono ${
        error ? 'border-red-500' : ''
      } ${className}`}
      {...props}
    />
  </FormGroup>
))
NumberInput.displayName = 'NumberInput'

// Select Component
export const SelectInput = React.forwardRef(({
  label,
  required,
  error,
  options = [],
  placeholder = '-- Chọn --',
  className = '',
  ...props
}, ref) => (
  <FormGroup label={label} required={required} error={error}>
    <select
      ref={ref}
      className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer ${
        error ? 'border-red-500' : ''
      } ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </FormGroup>
))
SelectInput.displayName = 'SelectInput'

// Date Input Component
export const DateInput = React.forwardRef(({
  label,
  required,
  error,
  value,
  onChange,
  minDate,
  maxDate,
  className = '',
  ...props
}, ref) => (
  <FormGroup label={label} required={required} error={error}>
    <ReactDatePicker
      selected={value ? new Date(value) : null}
      onChange={(date) => onChange?.(date)}
      minDate={minDate}
      maxDate={maxDate}
      dateFormat="dd/MM/yyyy"
      placeholderText="dd/mm/yyyy"
      className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full ${
        error ? 'border-red-500' : ''
      } ${className}`}
      {...props}
    />
  </FormGroup>
))
DateInput.displayName = 'DateInput'

// TextArea Component
export const TextArea = React.forwardRef(({
  label,
  required,
  error,
  placeholder,
  rows = 3,
  className = '',
  ...props
}, ref) => (
  <FormGroup label={label} required={required} error={error}>
    <textarea
      ref={ref}
      placeholder={placeholder}
      rows={rows}
      className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${
        error ? 'border-red-500' : ''
      } ${className}`}
      {...props}
    />
  </FormGroup>
))
TextArea.displayName = 'TextArea'

// Checkbox Component
export const Checkbox = React.forwardRef(({
  label,
  className = '',
  ...props
}, ref) => (
  <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
    <input
      ref={ref}
      type="checkbox"
      className="w-4 h-4 border border-gray-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
      {...props}
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
))
Checkbox.displayName = 'Checkbox'

// Radio Button Component
export const Radio = React.forwardRef(({
  label,
  className = '',
  ...props
}, ref) => (
  <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
    <input
      ref={ref}
      type="radio"
      className="w-4 h-4 border border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
      {...props}
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
))
Radio.displayName = 'Radio'

// Form Component
export const Form = ({ children, onSubmit, className = '' }) => (
  <form onSubmit={onSubmit} className={className}>
    {children}
  </form>
)

// Grid Layout for forms
export const FormGrid = ({ children, cols = 2, gap = 4, className = '' }) => (
  <div className={`grid grid-cols-${cols} gap-${gap} ${className}`}>
    {children}
  </div>
)

// Form Section
export const FormSection = ({ title, children, className = '' }) => (
  <div className={className}>
    {title && <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>}
    {children}
  </div>
)