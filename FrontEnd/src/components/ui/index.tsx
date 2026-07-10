/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { InputHTMLAttributes, ButtonHTMLAttributes, SelectHTMLAttributes, HTMLAttributes } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, XCircle, Loader2 } from 'lucide-react';

// --- CARD COMPONENT ---
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hoverEffect = false,
  ...props 
}) => {
  return (
    <div
      className={`
        bg-white border border-slate-100 rounded-xl shadow-xs p-6 
        ${hoverEffect ? 'transition-all duration-300 hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// --- BUTTON COMPONENT ---
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-sans font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  
  const variants = {
    primary: "bg-slate-950 text-white hover:bg-slate-800 focus:ring-slate-900",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
    ghost: "text-slate-600 hover:bg-slate-100 focus:ring-slate-100"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-6 py-3 gap-2"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props as any}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Please wait...</span>
        </>
      ) : children}
    </motion.button>
  );
};

// --- INPUT COMPONENT ---
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  className = '',
  label,
  error,
  id,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-2xs placeholder-slate-400
          transition-colors duration-200 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800
          ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-rose-600 font-sans mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};

// --- SELECT COMPONENT ---
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  className = '',
  label,
  error,
  options,
  id,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`
            w-full appearance-none px-3 py-2 pr-10 text-sm bg-white border rounded-lg shadow-2xs
            transition-colors duration-200 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800
            ${error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200'}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-xs text-rose-500 font-sans">
          {error}
        </span>
      )}
    </div>
  );
};

// --- ALERT COMPONENT ---
interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  className = '',
}) => {
  const styles = {
    info: {
      container: 'bg-blue-50 border-blue-100 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    },
    success: {
      container: 'bg-emerald-50 border-emerald-100 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-100 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    error: {
      container: 'bg-rose-50 border-rose-100 text-rose-800',
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
  };

  return (
    <div className={`flex gap-3 p-4 border rounded-xl ${styles[type].container} ${className}`}>
      {styles[type].icon}
      <div className="flex flex-col gap-0.5">
        {title && <span className="font-semibold text-sm leading-tight">{title}</span>}
        <span className="text-sm leading-relaxed">{message}</span>
      </div>
    </div>
  );
};

// --- LOADING SPINNER COMPONENT ---
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; message?: string; className?: string }> = ({
  size = 'md',
  message,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}>
      <Loader2 className={`animate-spin text-slate-800 ${sizeClasses[size]}`} />
      {message && <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>}
    </div>
  );
};
