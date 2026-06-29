'use client';

import * as React from 'react';

export default function DangerButton({
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border border-red-200 bg-red-50 px-6 py-3 font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50 shadow-sm ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
