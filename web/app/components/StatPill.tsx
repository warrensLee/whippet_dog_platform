"use client";

export default function StatPill({ label, value, accent }: {
    label: string;
    value: string | number;
    accent?: boolean;
})
{
    return (
        <div
            className={`flex flex-col items-center justify-center rounded-2xl px-4 py-4 shadow-sm ${
                accent
                    ? "bg-[#2E6B3F] text-white"
                    : "border border-black/10 bg-white text-[#12301D] shadow-md"
            }`}
        >
            <span className={`text-2xl font-bold tabular-nums ${accent ? "text-white" : "text-[#12301D]"}`}>
                {value}
            </span>

            <span
                className={`mt-1 text-[10px] font-semibold uppercase tracking-widest ${
                    accent ? "text-white/70" : "text-[#12301D]/50"
                }`}
            >
                {label}
            </span>
        </div>
    );
}