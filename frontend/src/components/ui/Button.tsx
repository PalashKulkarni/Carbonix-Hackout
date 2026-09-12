import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'tertiary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-sans font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1B3A2D] disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantClasses = {
    primary: 'bg-[#1B3A2D] text-[#F7F5F0] hover:bg-[#12281F] active:bg-[#0D1D16] shadow-sm',
    secondary: 'bg-[#EBF2EE] text-[#1B3A2D] border border-[#7A9B8A]/40 hover:bg-[#DCE7E1] active:bg-[#CBDCD2]',
    destructive: 'bg-[#C45B4A] text-white hover:bg-[#B04C3C] active:bg-[#9B3D2E] shadow-sm',
    tertiary: 'bg-transparent text-[#1B3A2D] hover:bg-[#1B3A2D]/5 active:bg-[#1B3A2D]/10 underline-offset-4 hover:underline',
    outline: 'bg-white text-[#2C2C2C] border border-[#E1DFDA] hover:bg-[#F7F5F0] hover:border-[#C8C5BE] shadow-xs',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
