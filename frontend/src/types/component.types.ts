import { ReactNode } from 'react'

/**
 * Base props that all components can extend
 */
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string
  /** Unique identifier for the component */
  id?: string
  /** Test identifier for testing */
  'data-testid'?: string
  /** Children elements */
  children?: ReactNode
}

/**
 * Common size variants for components
 */
export type ComponentSize = 'small' | 'medium' | 'large'

/**
 * Common color variants for components
 */
export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'

/**
 * Loading state interface
 */
export interface LoadingState {
  /** Whether the component is in a loading state */
  loading?: boolean
  /** Loading text to display */
  loadingText?: string
}

/**
 * Disabled state interface
 */
export interface DisabledState {
  /** Whether the component is disabled */
  disabled?: boolean
  /** Reason for being disabled (for accessibility) */
  disabledReason?: string
}

/**
 * Form field base props
 */
export interface FormFieldProps extends BaseComponentProps {
  /** Field label */
  label?: string
  /** Help text */
  helpText?: string
  /** Error message */
  error?: string
  /** Whether the field is required */
  required?: boolean
  /** Field name for form handling */
  name?: string
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  loading: boolean
  success: boolean
}

/**
 * Common event handlers
 */
export interface EventHandlers {
  onClick?: (event: React.MouseEvent) => void
  onFocus?: (event: React.FocusEvent) => void
  onBlur?: (event: React.FocusEvent) => void
  onKeyDown?: (event: React.KeyboardEvent) => void
}