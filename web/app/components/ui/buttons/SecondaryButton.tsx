'use client';

import * as React from 'react';

export default function SecondaryButton({
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
      className={`rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] transition hover:bg-[#12301D]/5 disabled:opacity-60 shadow-sm ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
