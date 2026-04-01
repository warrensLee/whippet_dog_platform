import * as React from "react";

export default function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-black/10 bg-white p-8 shadow-md transition hover:shadow-lg ${className}`}>
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[#12301D]">
        {title}
      </h2>
      {children}
    </div>
  );
}