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
  error,
  required,
  helpText,
  ...props
}, ref) => {
  const inputId = id || generateId();
  const hasError = Boolean(error);

  const baseInputClasses = [
    'w-full px-3 py-2 border rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-blue-500',
    'disabled:bg-gray-50 disabled:text-gray-500',
    hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
  ].join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
        <div id={`${inputId}-help`} className="text-sm text-gray-500">
          {helpText}
        </div>
      )}
      {error && (
        <div id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';