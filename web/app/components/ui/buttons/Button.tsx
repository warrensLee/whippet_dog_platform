'use client';

import * as React from 'react';

export default function Button({
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  form = undefined,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  form?: string
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={"block rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1 disabled:opacity-50 " + (fullWidth ? "w-full " : "") + className}
      form={form}
    >
      {children}
    </button>
  );
}
