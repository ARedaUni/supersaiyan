import { forwardRef } from 'react';
import { BaseComponentProps, FormFieldProps, EventHandlers } from '../../types/component.types';

export interface InputProps
  extends BaseComponentProps,
  FormFieldProps,
  Pick<EventHandlers, 'onFocus' | 'onBlur'> {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** Input value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const generateId = (): string => `input-${Math.random().toString(36).substring(2, 11)}`;

/** Universal Input component for form fields */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  type = 'text',
  className = '',
  id,
  disabled = true,
  error,
  required,
  helpText,
  ...props
}, ref) => {
  const inputId = id || generateId();
  const hasError = Boolean(error);

  const baseInputClasses = [
    'w-full px-4 py-3 border rounded-lg',
    'bg-gray-800 text-white placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
    'disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed',
    'transition-all duration-200 shadow-sm',
    hasError
      ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500'
      : 'border-gray-600 focus:ring-blue-500/50 focus:border-blue-500 hover:border-gray-500'
  ].join(' ');

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`${baseInputClasses} ${className}`.trim()}
        required={required}
        aria-invalid={hasError}
        aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        {...props}
      />
      {helpText && !error && (
        <div id={`${inputId}-help`} className="text-sm text-gray-400">
          {helpText}
        </div>
      )}
      {error && (
        <div id={`${inputId}-error`} className="text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';