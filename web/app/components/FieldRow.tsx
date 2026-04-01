"use client";

export default function FieldRow({ label, value, emphasizedLabels = [] }: {
    label: string;
    value?: string | number | null;
    emphasizedLabels?: string[];
})
{
    if (value == null || value === "") return null;

    const emphasized = emphasizedLabels.includes(label);

    return (
        <div className="flex items-baseline justify-between gap-3 border-b border-black/5 py-2 last:border-0">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[#12301D]/80">
                {label}
            </span>

            <span
                className={`text-right ${
                    emphasized
                        ? "text-base font-bold text-[#2E6B3F]"
                        : "text-sm font-medium text-[#2E6B3F]"
                }`}
            >
                {String(value)}
            </span>
        </div>
    );
}