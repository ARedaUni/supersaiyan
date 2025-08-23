export interface ButtonProps {
  /** Is this the principal call to action on the page? */
  primary?: boolean;
  /** How large should the button be? */
  size?: 'small' | 'medium' | 'large';
  /** Button contents */
  label: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/** Primary UI component for user interaction */
export const Button = ({
  primary = false,
  size = 'medium',
  label,
  className = '',
  ...props
}: ButtonProps) => {
  const baseClasses = 'font-bold border-0 rounded-full cursor-pointer inline-block leading-none';

  const variantClasses = primary
    ? 'text-white bg-blue-500 hover:bg-blue-600'
    : 'text-gray-700 bg-transparent border border-gray-300 hover:bg-gray-50';

  const sizeClasses = {
    small: 'text-xs py-2.5 px-4',
    medium: 'text-sm py-3 px-5',
    large: 'text-base py-3 px-6'
  }[size];



  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim()}
      {...props}
    >
      {label}
    </button>
  );
};