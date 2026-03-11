"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DogDetail {
  cwaNumber: string;
  registeredName: string;
  callName?: string;
  birthdate?: string;
  status?: string;
  currentGrade?: string;
  average?: string | number;
  arxPoints?: number;
  narxPoints?: number;
  meetPoints?: number;
  meetWins?: number;
  meetAppearences?: number;
  highCombinedWins?: number;
  dpcLegs?: number;
  showPoints?: number;
  akcNumber?: string | null;
  ckcNumber?: string | null;
  foreignNumber?: string | null;
  foreignType?: string | null;
  pedigreeLink?: string | null;
  notes?: string | null;
}

interface MeetEntry {
  MeetNumber: string | number;
  MeetDate?: string;
  ClubAbbreviation?: string;
  Location?: string;
  meetResults?: MeetResult[];
  raceResults?: RaceResult[];
}

interface MeetResult {
  MeetPlacement?: number;
  MeetPoints?: number;
  ARXEarned?: number;
  NARXEarned?: number;
  ShowPoints?: number;
  DPCLeg?: number;
  [key: string]: unknown;
}

interface RaceResult {
  Program?: string | number;
  RaceNumber?: string | number;
  Placement?: number;
  Points?: number;
  [key: string]: unknown;
}

interface DogOwner {
  PersonID?: string | number;
  FirstName?: string;
  LastName?: string;
  EmailAddress?: string;
}

// ─── Title tier definitions ───────────────────────────────────────────────────

type TierColor = "gray" | "yellow" | "blue" | "purple" | "gold" | "teal" | "green";

interface TitleTier {
  name: string;
  threshold: number;
  color: TierColor;
}

interface TitleFamily {
  family: string;
  description: string;
  tiers: TitleTier[];
  getValue: (d: DogDetail) => number;
  unit: string;
  extraCheck?: (d: DogDetail) => string | null; // null = locked, string = reason
}

const TIER_STYLES: Record<TierColor, { bg: string; text: string; border: string; badge: string }> = {
  gray:   { bg: "bg-neutral-100",  text: "text-neutral-400",  border: "border-neutral-200",  badge: "bg-neutral-200 text-neutral-500" },
  yellow: { bg: "bg-emerald-50",   text: "text-emerald-700",  border: "border-emerald-300",  badge: "bg-[#2E6B3F] text-white" },
  blue:   { bg: "bg-emerald-50",   text: "text-emerald-700",  border: "border-emerald-300",  badge: "bg-[#2E6B3F] text-white" },
  purple: { bg: "bg-emerald-50",   text: "text-emerald-700",  border: "border-emerald-300",  badge: "bg-[#2E6B3F] text-white" },
  gold:   { bg: "bg-emerald-50",   text: "text-emerald-700",  border: "border-emerald-300",  badge: "bg-[#2E6B3F] text-white" },
  teal:   { bg: "bg-emerald-50",   text: "text-emerald-700",  border: "border-emerald-300",  badge: "bg-[#2E6B3F] text-white" },
  green:  { bg: "bg-emerald-50",   text: "text-emerald-700",  border: "border-emerald-300",  badge: "bg-[#2E6B3F] text-white" },
};

const TITLE_FAMILIES: TitleFamily[] = [
  {
    family: "ARX",
    description: "Award of Racing Excellence — place in top 50% of adult finishers",
    unit: "ARX pts",
    getValue: (d) => d.arxPoints ?? 0,
    tiers: [
      { name: "ARX", threshold: 15, color: "green" },
    ],
  },
  {
    family: "TRP",
    description: "Title of Racing Proficiency — complete all 4 heats at 10 meets",
    unit: "meets",
    getValue: (d) => d.meetAppearences ?? 0,
    tiers: [
      { name: "TRP", threshold: 10, color: "blue" },
    ],
  },
  {
    family: "PR",
    description: "Performance Racer — earn race points by completing meets",
    unit: "meet pts",
    getValue: (d) => d.meetPoints ?? 0,
    tiers: [
      { name: "PR",  threshold: 50,  color: "yellow" },
      { name: "PR2", threshold: 150, color: "blue" },
      { name: "PR3", threshold: 250, color: "purple" },
      { name: "PR4", threshold: 350, color: "gold" },
      { name: "PRX", threshold: 450, color: "green" },
    ],
  },
  {
    family: "NARX",
    description: "National Racing Excellence — earned through NARX points",
    unit: "NARX pts",
    getValue: (d) => d.narxPoints ?? 0,
    tiers: [
      { name: "NARX",  threshold: 15,  color: "yellow" },
      { name: "NARX2", threshold: 30,  color: "blue" },
      { name: "NARX3", threshold: 45,  color: "purple" },
      { name: "NARX4", threshold: 60,  color: "gold" },
      { name: "SRA",   threshold: 75,  color: "teal" },
      { name: "SRA2",  threshold: 150, color: "teal" },
      { name: "SRA3",  threshold: 225, color: "teal" },
      { name: "SRA4",  threshold: 300, color: "green" },
    ],
  },
  {
    family: "DPC",
    description: "Dual Purpose Championship — requires TRP + AKC/CKC bench championship OR 5 DPC legs",
    unit: "DPC legs",
    getValue: (d) => d.dpcLegs ?? 0,
    tiers: [
      { name: "DPC",  threshold: 5, color: "blue" },
      { name: "DPCX", threshold: 5, color: "green" }, // also requires ARX
    ],
    extraCheck: (d) => {
      const hasTRP = (d.meetAppearences ?? 0) >= 10;
      if (!hasTRP) return "Requires TRP first";
      return null;
    },
  },
  {
    family: "HC",
    description: "High Combined — wins High Combined at meets (adult dogs only)",
    unit: "HC wins",
    getValue: (d) => d.highCombinedWins ?? 0,
    tiers: [
      { name: "HC",   threshold: 5,  color: "yellow" },
      { name: "HCX",  threshold: 10, color: "blue" },
      { name: "HCX2", threshold: 15, color: "purple" },
      { name: "HCX3", threshold: 20, color: "gold" },
      { name: "HCX4", threshold: 25, color: "green" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatDate(raw?: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function calcAgeMonths(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function ageLabelStr(months: number | null): string | null {
  if (months === null) return null;
  const y = Math.floor(months / 12);
  const m = months % 12;
  const cat = months < 8 ? "Puppy" : months >= 84 ? "Veteran" : months >= 14 ? "Adult" : "";
  return `${y > 0 ? `${y}y ` : ""}${m}m${cat ? ` · ${cat}` : ""}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl px-4 py-4 ${
      accent ? "bg-[#2E6B3F] text-white" : "bg-white/70 border border-black/10 text-[#12301D]"
    }`}>
      <span className={`text-2xl font-bold tabular-nums ${accent ? "text-white" : "text-[#12301D]"}`}>{value}</span>
      <span className={`text-[10px] uppercase tracking-widest mt-1 font-semibold ${accent ? "text-white/70" : "text-[#12301D]/50"}`}>{label}</span>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-black/5 last:border-0">
      <span className="text-[11px] text-[#12301D]/50 uppercase tracking-wider font-semibold shrink-0">{label}</span>
      <span className="text-sm text-[#12301D] font-medium text-right">{String(value)}</span>
    </div>
  );
}

function PointBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-24 text-[11px] text-[#12301D]/50 uppercase tracking-wider font-semibold shrink-0">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-black/8 overflow-hidden">
        <div className="h-full rounded-full bg-[#2E6B3F] transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-12 text-right text-sm font-bold text-[#12301D] tabular-nums">{value}</div>
    </div>
  );
}

// ─── Title Family Card ────────────────────────────────────────────────────────

function TitleFamilyCard({ family, dog }: { family: TitleFamily; dog: DogDetail }) {
  const value = family.getValue(dog);
  const locked = family.extraCheck ? family.extraCheck(dog) : null;

  // Find highest earned tier
  const earnedTiers = family.tiers.filter((t) => !locked && value >= t.threshold);
  const highestEarned = earnedTiers[earnedTiers.length - 1] ?? null;

  // Next tier
  const nextTier = family.tiers.find((t) => value < t.threshold) ?? null;

  const hasAnyEarned = earnedTiers.length > 0;
  const [open, setOpen] = React.useState(hasAnyEarned);

  const progressPct = nextTier
    ? Math.min(100, (value / nextTier.threshold) * 100)
    : 100;

  const currentStyle = highestEarned
    ? TIER_STYLES[highestEarned.color]
    : TIER_STYLES.gray;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      hasAnyEarned ? `${currentStyle.border} shadow-sm` : "border-black/10"
    }`}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
          hasAnyEarned ? currentStyle.bg : "bg-white/60 hover:bg-white/80"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Current title badge */}
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            hasAnyEarned ? currentStyle.badge : "bg-black/8 text-[#12301D]/30"
          }`}>
            {highestEarned ? highestEarned.name : family.family}
          </span>
          <div>
            <p className={`text-sm font-semibold ${hasAnyEarned ? currentStyle.text : "text-[#12301D]/40"}`}>
              {family.family} Titles
            </p>
            <p className="text-[10px] text-[#12301D]/40 mt-0.5">
              {locked
                ? locked
                : nextTier
                ? `${nextTier.threshold - value} ${family.unit} until ${nextTier.name}`
                : "All tiers earned!"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Mini progress bar */}
          {!locked && nextTier && (
            <div className="w-20 h-1.5 rounded-full bg-black/10 overflow-hidden hidden sm:block">
              <div
                className={`h-full rounded-full transition-all duration-700 ${hasAnyEarned ? "bg-[#2E6B3F]" : "bg-black/20"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
          <span className="text-xs font-mono text-[#12301D]/40 tabular-nums">
            {value} {family.unit}
          </span>
          <svg
            className={`w-4 h-4 text-[#12301D]/30 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded ladder */}
      {open && (
        <div className="border-t border-black/8 bg-white/40 px-5 py-4">
          <p className="text-xs text-[#12301D]/50 italic mb-4">{family.description}</p>

          {locked && (
            <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 font-medium">
              🔒 {locked}
            </div>
          )}

          {/* Progress bar toward next tier */}
          {!locked && nextTier && (
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-[#12301D]/40 mb-1">
                <span>{value} {family.unit}</span>
                <span>{nextTier.threshold} needed for {nextTier.name}</span>
              </div>
              <div className="h-2 rounded-full bg-black/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2E6B3F] transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Tier ladder */}
          <div className="space-y-2">
            {family.tiers.map((tier) => {
              const earned = !locked && value >= tier.threshold;
              const isCurrent = tier === highestEarned;
              const style = TIER_STYLES[tier.color];
              return (
                <div
                  key={tier.name}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-all ${
                    isCurrent
                      ? `${style.bg} ${style.border} shadow-sm`
                      : earned
                      ? `${style.bg} ${style.border} opacity-70`
                      : "bg-black/3 border-black/8 opacity-50"
                  }`}
                >
                  {/* Check / dot */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    earned ? style.badge : "bg-black/10"
                  }`}>
                    {earned ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                    )}
                  </div>

                  <span className={`text-sm font-bold tracking-wide ${earned ? style.text : "text-[#12301D]/30"}`}>
                    {tier.name}
                  </span>

                  <span className="text-xs text-[#12301D]/40 ml-auto tabular-nums">
                    {tier.threshold} {family.unit}
                    {tier.name === "DPCX" ? " + ARX" : ""}
                    {tier.name === "DPC" ? " + TRP" : ""}
                  </span>

                  {isCurrent && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* DPC special: legs progress */}
          {family.family === "DPC" && (
            <div className="mt-4 pt-3 border-t border-black/8">
              <p className="text-[10px] text-[#12301D]/40 uppercase tracking-widest font-semibold mb-2">
                Conformation Legs ({dog.dpcLegs ?? 0} / 5)
              </p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className={`flex-1 h-2.5 rounded-full ${
                    (dog.dpcLegs ?? 0) >= n ? "bg-[#2E6B3F]" : "bg-black/10"
                  }`} />
                ))}
              </div>
              <p className="text-[10px] text-[#12301D]/40 mt-1.5">
                Or: hold AKC / CKC bench championship
                {(dog.akcNumber || dog.ckcNumber) ? " ✓" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Meet Card ───────────────────────────────────────────────────────────────

function MeetCard({ meet }: { meet: MeetEntry }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-xl border border-black/8 bg-white/60 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/80 transition-colors text-left"
      >
        <div>
          <p className="text-sm font-semibold text-[#12301D]">
            {meet.ClubAbbreviation ?? `Meet ${meet.MeetNumber}`}
            {meet.Location ? <span className="text-[#12301D]/50 font-normal"> · {meet.Location}</span> : null}
          </p>
          {meet.MeetDate && <p className="text-xs text-[#12301D]/50 mt-0.5">{formatDate(meet.MeetDate)}</p>}
        </div>
        <svg className={`w-4 h-4 text-[#12301D]/40 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-black/8 px-4 py-3 space-y-3">
          {(meet.meetResults ?? []).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#12301D]/40 font-semibold mb-1">Meet Results</p>
              {meet.meetResults!.map((mr, i) => (
                <div key={i} className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#12301D]/70 py-1 border-b border-black/5 last:border-0">
                  {mr.MeetPlacement != null && <span>Place: <b className="text-[#2E6B3F]">#{mr.MeetPlacement}</b></span>}
                  {mr.MeetPoints    != null && <span>Pts: <b>{mr.MeetPoints}</b></span>}
                  {mr.ARXEarned != null && mr.ARXEarned > 0  && <span>ARX: <b>{mr.ARXEarned}</b></span>}
                  {mr.NARXEarned != null && mr.NARXEarned > 0 && <span>NARX: <b>{mr.NARXEarned}</b></span>}
                  {mr.ShowPoints != null && mr.ShowPoints > 0  && <span>Show: <b>{mr.ShowPoints}</b></span>}
                  {mr.DPCLeg === 1 && <span className="text-amber-600 font-semibold">DPC Leg ✓</span>}
                </div>
              ))}
            </div>
          )}
          {(meet.raceResults ?? []).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#12301D]/40 font-semibold mb-1">Race Results</p>
              <div className="grid grid-cols-3 gap-1">
                {meet.raceResults!.map((rr, i) => (
                  <div key={i} className="rounded-lg bg-black/5 px-2 py-1.5 text-xs text-center">
                    <p className="text-[#12301D]/50">P{rr.Program} R{rr.RaceNumber}</p>
                    <p className="font-bold text-[#12301D]">#{rr.Placement ?? "—"}</p>
                    {rr.Points != null && <p className="text-[#2E6B3F] font-semibold">{rr.Points}pt</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/10 bg-white/80 backdrop-blur p-6 shadow-sm ${className}`}>
      <h2 className="text-[11px] font-bold text-[#12301D] mb-4 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DogPage() {
  const params = useParams();
  const cwaNumber = decodeURIComponent(String(params.id ?? ""));
  const enc = encodeURIComponent(cwaNumber);

  const [dog, setDog] = React.useState<DogDetail | null>(null);
  const [meets, setMeets] = React.useState<MeetEntry[]>([]);
  const [owners, setOwners] = React.useState<DogOwner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    if (!cwaNumber) return;
    setLoading(true);
    setError("");

    fetchJson<{ ok: boolean; data: DogDetail }>(`/api/dog/get/${enc}`)
      .then((r) => setDog(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    fetchJson<{ ok: boolean; data: MeetEntry[] }>(`/api/dog/meets/${enc}`)
      .then((r) => setMeets(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});

    fetchJson<{ ok: boolean; data: DogOwner[] }>(`/api/dog_owner/owners/${enc}`)
      .then((r) => setOwners(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, [cwaNumber]);

  const ageMonths = dog ? calcAgeMonths(dog.birthdate) : null;
  const maxPoints = Math.max(dog?.meetPoints ?? 0, dog?.arxPoints ?? 0, dog?.narxPoints ?? 0, 1);
  const statusColor = dog?.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500";

  return (
    <main className="min-h-screen bg-[#1F4D2E]">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-35 pb-0 bg-gradient-to-b from-[#1A4228] to-[#18452A] overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute top-0 left-1/2 h-[250px] w-[500px] -translate-x-1/2 rounded-full bg-[#2E6B3F]/20 blur-3xl" />
        </div>

        <div
          className="relative z-10 max-w-4xl mx-auto px-6 pb-16 text-center"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-300 text-lg">{error}</p>
          ) : dog ? (
            <>
              <p className="text-white/50 text-xs tracking-[0.35em] uppercase font-semibold mb-3">
                Dog Profile · {dog.cwaNumber}
              </p>
              <h1 className="text-white font-bold leading-none tracking-tight"
                style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", fontFamily: "'Georgia', serif", textShadow: "0 2px 30px rgba(0,0,0,0.3)" }}>
                {dog.registeredName}
              </h1>
              {dog.callName && <p className="mt-2 text-white/50 text-base italic">"{dog.callName}"</p>}
              <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                {dog.status && <span className={`rounded-full px-4 py-1 text-xs font-semibold ${statusColor}`}>{dog.status}</span>}
                {dog.currentGrade && <span className="rounded-full bg-white/10 px-4 py-1 text-white/80 text-xs font-mono tracking-wider">Grade {dog.currentGrade}</span>}
                {dog.average != null && <span className="rounded-full bg-white/10 px-4 py-1 text-white/80 text-xs font-mono tracking-wider">Avg {dog.average}</span>}
              </div>
            </>
          ) : null}
        </div>

        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="absolute left-0 bottom-0 w-full h-20">
          <path d="M 0 0 L 144 19 L 288 36 L 432 51 L 576 64 L 720 75 L 864 84 L 1008 91 L 1152 96 L 1296 99 L 1440 100 L 1440 100 L 0 100 Z" fill="#E7F0E9" />
        </svg>
      </section>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#E7F0E9] pt-10 pb-24">
        <div className="max-w-4xl mx-auto px-6 space-y-6">

          {/* Stat pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.6s ease 0.15s" }}>
            <StatPill label="Meet Points"  value={dog?.meetPoints  ?? "—"} accent />
            <StatPill label="Meet Wins"    value={dog?.meetWins    ?? "—"} />
            <StatPill label="Appearances"  value={dog?.meetAppearences ?? "—"} />
            <StatPill label="High Combo W" value={dog?.highCombinedWins ?? "—"} />
          </div>

          {/* Details + Points */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card title="Details" className="lg:col-span-2 h-fit">
              {loading ? <p className="text-[#12301D]/40 text-sm">Loading…</p> : dog ? (
                <>
                  <FieldRow label="CWA #"       value={dog.cwaNumber} />
                  <FieldRow label="birthdate"    value={formatDate(dog.birthdate)} />
                  <FieldRow label="Age"          value={ageLabelStr(ageMonths)} />
                  <FieldRow label="AKC #"        value={dog.akcNumber} />
                  <FieldRow label="CKC #"        value={dog.ckcNumber} />
                  <FieldRow label="Foreign #"    value={dog.foreignNumber} />
                  <FieldRow label="Foreign Type" value={dog.foreignType} />
                  {dog.pedigreeLink && (
                    <div className="py-2">
                      <a href={dog.pedigreeLink} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-[#2E6B3F] underline hover:text-[#1a4228] transition">
                        View Pedigree ↗
                      </a>
                    </div>
                  )}
                  {dog.notes && <p className="mt-2 text-xs text-[#12301D]/40 italic">{dog.notes}</p>}
                </>
              ) : null}
            </Card>

            <Card title="Points Breakdown" className="lg:col-span-3 h-fit">
              {dog ? (
                <>
                  <PointBar label="Meet Pts"  value={dog.meetPoints  ?? 0} max={maxPoints} />
                  <PointBar label="ARX Pts"   value={dog.arxPoints   ?? 0} max={maxPoints} />
                  <PointBar label="NARX Pts"  value={dog.narxPoints  ?? 0} max={maxPoints} />
                  <PointBar label="Show Pts"  value={dog.showPoints  ?? 0} max={maxPoints} />
                </>
              ) : <p className="text-[#12301D]/40 text-sm">Loading…</p>}
            </Card>
          </div>

          {/* Owners */}
          <Card title={`Owner${owners.length !== 1 ? "s" : ""}${owners.length > 0 ? ` (${owners.length})` : ""}`}>
            {owners.length === 0 ? (
              <p className="text-[#12301D]/40 text-sm py-2 text-center">No owners on record.</p>
            ) : (
              <div className="divide-y divide-black/5">
                {owners.map((o, i) => {
                  const fullName = [o.FirstName, o.LastName].filter(Boolean).join(" ") || "Unknown";
                  return (
                    <div key={o.PersonID ?? i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      {/* Avatar initial */}
                      <div className="w-9 h-9 rounded-full bg-[#2E6B3F] flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-bold">
                          {(o.FirstName?.[0] ?? "?").toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#12301D] truncate">{fullName}</p>
                        {o.EmailAddress && (
                          <a href={`mailto:${o.EmailAddress}`}
                            className="text-xs text-[#2E6B3F] hover:underline truncate block">
                            {o.EmailAddress}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Title progression ladders */}
          {dog && (
            <div>
              <h2 className="text-[11px] font-bold text-[#12301D] mb-3 uppercase tracking-widest px-1">
                Title Progression
              </h2>
              <div className="space-y-3">
                {TITLE_FAMILIES.map((family) => (
                  <TitleFamilyCard key={family.family} family={family} dog={dog} />
                ))}
              </div>
            </div>
          )}

          {/* Meet history */}
          <Card title={`Meet History${meets.length > 0 ? ` (${meets.length})` : ""}`}>
            {meets.length === 0 ? (
              <p className="text-[#12301D]/40 text-sm py-4 text-center">No meet records found.</p>
            ) : (
              <div className="space-y-2">
                {meets.map((m) => <MeetCard key={m.MeetNumber} meet={m} />)}
              </div>
            )}
          </Card>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#DCE7DF] pb-2">
        <hr className="h-px bg-black/25 border-0 -mt-6 mb-4" />
        <p className="text-[#12301D] text-sm text-center leading-relaxed">
          <span className="block">
            Questions? Email{" "}
            <a href="mailto:cwawhippetracing@gmail.com" className="underline hover:text-[#2E6B3F] transition">
              cwawhippetracing@gmail.com
            </a>
          </span>
          <span className="block mt-1">© 2026 Continental Whippet Alliance. All rights reserved.</span>
        </p>
      </footer>
    </main>
  );
}