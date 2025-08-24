import { forwardRef } from 'react'
import { BaseComponentProps, ComponentSize, ComponentVariant, LoadingState, DisabledState, EventHandlers } from '../../types/component.types'

export interface ButtonProps extends BaseComponentProps, LoadingState, DisabledState, Pick<EventHandlers, 'onClick'> {
  /** Button variant */
  variant?: ComponentVariant | 'primary' | 'secondary'
  /** Button size */
  size?: ComponentSize
  /** Button contents - can be string or ReactNode */
  children: React.ReactNode
  /** Button type */
  type?: 'button' | 'submit' | 'reset'
  /** Whether the button should take full width */
  fullWidth?: boolean
  /** Icon to display before text */
  startIcon?: React.ReactNode
  /** Icon to display after text */
  endIcon?: React.ReactNode
}

/** Primary UI component for user interaction */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  children,
  className = '',
  loading = false,
  disabled = false,
  disabledReason,
  type = 'button',
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  'data-testid': testId,
  ...props
}, ref) => {
  const isDisabled = disabled || loading

  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'shadow-lg hover:shadow-xl',
    fullWidth ? 'w-full' : 'w-auto'
  ].join(' ')

  const variantClasses = {
    primary: 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500/50 disabled:from-blue-400 disabled:to-blue-500',
    secondary: 'text-blue-400 bg-gray-800 hover:bg-gray-700 focus:ring-blue-500/50 border border-gray-600 hover:border-gray-500',
    success: 'text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:ring-emerald-500/50 disabled:from-emerald-400 disabled:to-emerald-500',
    warning: 'text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:ring-amber-500/50 disabled:from-amber-400 disabled:to-amber-500',
    error: 'text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500/50 disabled:from-red-400 disabled:to-red-500',
    info: 'text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:ring-indigo-500/50 disabled:from-indigo-400 disabled:to-indigo-500'
  }[variant]

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm gap-1.5',
    medium: 'px-4 py-2 text-base gap-2',
    large: 'px-6 py-3 text-lg gap-2.5'
  }[size]

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled || !onClick) return
    
    // Prevent double clicks during loading
    if (loading) {
      event.preventDefault()
      return
    }

    onClick(event)
  }

  return (
    <button
      ref={ref}
      type={type}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim()}
      disabled={isDisabled}
      onClick={handleClick}
      data-testid={testId}
      aria-label={disabledReason && isDisabled ? disabledReason : undefined}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {startIcon && <span className="flex-shrink-0">{startIcon}</span>}
          <span>{children}</span>
          {endIcon && <span className="flex-shrink-0">{endIcon}</span>}
        </>
      )}
    </button>
  )
})

Button.displayName = 'Button'