export default function PointBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[#12301D]/80">
        {label}
      </div>

      <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/8">
        <div
          className="h-full rounded-full bg-[#2E6B3F] transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="w-12 text-right text-sm font-bold tabular-nums text-[#12301D]">
        {value}
      </div>
    </div>
  );
}