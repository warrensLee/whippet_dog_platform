"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import HeroSection from "../../components/HeroSection";
import InfoCard from "../../components/InfoCard";
import FieldRow from "../../components/FieldRow";
import StatPill from "../../components/StatPill";
import RaceLineup from "../../components/RaceLineup";
import { fetchJson } from "../../../lib/ui/fetchJson";
import { formatDate } from "../../../lib/ui/formatDate";

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
  [key: string]: unknown;
}

interface DogOwner {
  PersonID?: string | number;
  FirstName?: string;
  LastName?: string;
  EmailAddress?: string;
}

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
  getValue: (dog: DogDetail) => number;
  unit: string;
  extraCheck?: (dog: DogDetail) => string | null;
}

type RaceLineupEntry = {
  cwaNumber: string;
  dogName: string;
  registeredName: string | null;
  placement: number | null;
  points: number | null;
};

type RaceLineup = {
  meetNumber: string;
  program: string;
  raceNumber: string;
  entries: RaceLineupEntry[];
};

type RaceLineupMap = Record<string, RaceLineup>;

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_STYLES: Record<TierColor, { bg: string; text: string; border: string; badge: string }> = {
  gray: {
    bg: "bg-neutral-100",
    text: "text-neutral-400",
    border: "border-neutral-200",
    badge: "bg-neutral-200 text-neutral-500",
  },
  yellow: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
  blue: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
  purple: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
  gold: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
  teal: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
};

const TITLE_FAMILIES: TitleFamily[] = [
  {
    family: "TRP",
    description: "Title of Racing Proficiency — complete all 4 heats at 10 meets",
    unit: "meets",
    getValue: (dog) => dog.meetAppearences ?? 0,
    tiers: [{ name: "TRP", threshold: 10, color: "blue" }],
  },
  {
    family: "PR",
    description: "Performance Racer — earn race points by completing meets",
    unit: "meet pts",
    getValue: (dog) => dog.meetPoints ?? 0,
    tiers: [
      { name: "PR", threshold: 50, color: "yellow" },
      { name: "PR2", threshold: 150, color: "blue" },
      { name: "PR3", threshold: 250, color: "purple" },
      { name: "PR4", threshold: 350, color: "gold" },
      { name: "PRX", threshold: 450, color: "green" },
    ],
  },
  {
    family: "ARX",
    description: "Award of Racing Excellence — place in top 50% of adult finishers",
    unit: "ARX pts",
    getValue: (dog) => dog.arxPoints ?? 0,
    tiers: [{ name: "ARX", threshold: 15, color: "green" }],
  },
  {
    family: "NARX/SRA",
    description: "National Racing Excellence — earned through NARX points",
    unit: "NARX pts",
    getValue: (dog) => dog.narxPoints ?? 0,
    tiers: [
      { name: "NARX", threshold: 15, color: "yellow" },
      { name: "NARX2", threshold: 30, color: "blue" },
      { name: "NARX3", threshold: 45, color: "purple" },
      { name: "NARX4", threshold: 60, color: "gold" },
      { name: "SRA", threshold: 75, color: "teal" },
      { name: "SRA2", threshold: 150, color: "teal" },
      { name: "SRA3", threshold: 225, color: "teal" },
      { name: "SRA4", threshold: 300, color: "green" },
    ],
  },
  {
    family: "DPC",
    description: "Dual Purpose Championship — requires TRP + AKC/CKC bench championship OR 5 DPC legs",
    unit: "DPC legs",
    getValue: (dog) => dog.dpcLegs ?? 0,
    tiers: [
      { name: "DPC", threshold: 5, color: "blue" },
      { name: "DPCX", threshold: 5, color: "green" },
    ],
    extraCheck: (dog) => {
      const hasTRP = (dog.meetAppearences ?? 0) >= 10;
      return hasTRP ? null : "Requires TRP first";
    },
  },
  {
    family: "HC",
    description: "High Combined — wins High Combined at meets (adult dogs only)",
    unit: "HC wins",
    getValue: (dog) => dog.highCombinedWins ?? 0,
    tiers: [
      { name: "HC", threshold: 5, color: "yellow" },
      { name: "HCX", threshold: 10, color: "blue" },
      { name: "HCX2", threshold: 15, color: "purple" },
      { name: "HCX3", threshold: 20, color: "gold" },
      { name: "HCX4", threshold: 25, color: "green" },
    ],
  },
];


function calcAgeMonths(birthdate?: string | null): number | null
{
  if (!birthdate) return null;

  const birth = new Date(birthdate);

  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const now = new Date();

  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function ageLabel(months: number | null): string | null
{
  if (months === null) return null;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const category =
    months < 8 ? "Puppy" :
    months >= 84 ? "Veteran" :
    months >= 14 ? "Adult" :
    "";

  return `${years > 0 ? `${years}y ` : ""}${remainingMonths}m${category ? ` · ${category}` : ""}`;
}

function buildRaceKey(meetNumber: string | number, program: string, raceNumber: string): string
{
  return `${meetNumber}-${program}-${raceNumber}`;
}

function getStatusColor(status?: string): string
{
  return status?.trim() === "Active"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-neutral-200 text-neutral-600";
}



function PointBar({ label, value, max }: { label: string; value: number; max: number })
{
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

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string })
{
  return (
    <div className={`rounded-2xl border border-black/10 bg-white p-8 shadow-md transition hover:shadow-lg ${className}`}>
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[#12301D]">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Title Cards ─────────────────────────────────────────────────────────────

function TitleFamilyCard({ family, dog }: { family: TitleFamily; dog: DogDetail })
{
  const value = family.getValue(dog);
  const locked = family.extraCheck ? family.extraCheck(dog) : null;
  const earnedTiers = family.tiers.filter((tier) => !locked && value >= tier.threshold);
  const highestEarned = earnedTiers[earnedTiers.length - 1] ?? null;
  const nextTier = family.tiers.find((tier) => value < tier.threshold) ?? null;
  const hasAnyEarned = earnedTiers.length > 0;
  const [open, setOpen] = React.useState(hasAnyEarned);

  const progressPercent = nextTier ? Math.min(100, (value / nextTier.threshold) * 100) : 100;
  const currentStyle = highestEarned ? TIER_STYLES[highestEarned.color] : TIER_STYLES.gray;

  return (
    <div className={`overflow-hidden rounded-2xl border transition-all ${hasAnyEarned ? `${currentStyle.border} shadow-sm` : "border-black/10"}`}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
          hasAnyEarned ? currentStyle.bg : "bg-white/60 hover:bg-white/80"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              hasAnyEarned ? currentStyle.badge : "bg-black/8 text-[#12301D]/30"
            }`}
          >
            {highestEarned ? highestEarned.name : family.family}
          </span>

          <div>
            <p className={`text-sm font-semibold ${hasAnyEarned ? currentStyle.text : "text-[#12301D]/40"}`}>
              {family.family} Titles
            </p>

            <p className="mt-0.5 text-[10px] text-[#12301D]/40">
              {locked
                ? locked
                : nextTier
                ? `${nextTier.threshold - value} ${family.unit} until ${nextTier.name}`
                : "All tiers earned!"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {!locked && nextTier && (
            <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-black/10 sm:block">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  hasAnyEarned ? "bg-[#2E6B3F]" : "bg-black/20"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          <span className="font-mono text-xs tabular-nums text-[#12301D]/40">
            {value} {family.unit}
          </span>

          <svg
            className={`h-4 w-4 text-[#12301D]/30 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-black/8 bg-white/40 px-5 py-4">
          <p className="mb-4 text-xs italic text-[#12301D]/50">
            {family.description}
          </p>

          {locked && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              🔒 {locked}
            </div>
          )}

          {!locked && nextTier && (
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-[10px] text-[#12301D]/40">
                <span>{value} {family.unit}</span>
                <span>{nextTier.threshold} needed for {nextTier.name}</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-black/8">
                <div
                  className="h-full rounded-full bg-[#2E6B3F] transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {family.tiers.map((tier) => {
              const earned = !locked && value >= tier.threshold;
              const isCurrent = tier === highestEarned;
              const style = TIER_STYLES[tier.color];

              return (
                <div
                  key={tier.name}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all ${
                    isCurrent
                      ? `${style.bg} ${style.border} shadow-sm`
                      : earned
                      ? `${style.bg} ${style.border} opacity-70`
                      : "border-black/8 bg-black/3 opacity-50"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      earned ? style.badge : "bg-black/10"
                    }`}
                  >
                    {earned ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-black/20" />
                    )}
                  </div>

                  <span className={`text-sm font-bold tracking-wide ${earned ? style.text : "text-[#12301D]/30"}`}>
                    {tier.name}
                  </span>

                  <span className="ml-auto text-xs tabular-nums text-[#12301D]/40">
                    {tier.threshold} {family.unit}
                    {tier.name === "DPCX" ? " + ARX" : ""}
                    {tier.name === "DPC" ? " + TRP" : ""}
                  </span>

                  {isCurrent && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {family.family === "DPC" && (
            <div className="mt-4 border-t border-black/8 pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#12301D]/40">
                Conformation Legs ({dog.dpcLegs ?? 0} / 5)
              </p>

              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((leg) => (
                  <div
                    key={leg}
                    className={`h-2.5 flex-1 rounded-full ${(dog.dpcLegs ?? 0) >= leg ? "bg-[#2E6B3F]" : "bg-black/10"}`}
                  />
                ))}
              </div>

              <p className="mt-1.5 text-[10px] text-[#12301D]/40">
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

// ─── Meet History ────────────────────────────────────────────────────────────
function MeetCard({ meet, currentCwaNumber }: { meet: MeetEntry; currentCwaNumber: string })
{
  const [open, setOpen] = React.useState(false);
  const [raceDetails, setRaceDetails] = React.useState<RaceLineupMap>({});
  const [loadingRaces, setLoadingRaces] = React.useState(false);
  const [raceError, setRaceError] = React.useState("");

  const sortedRaces = React.useMemo(() => {
    const seen = new Map<string, { program: string; raceNumber: string }>();

    for (const race of meet.raceResults ?? []) {
      const program = String(race.Program ?? "").trim();
      const raceNumber = String(race.RaceNumber ?? "").trim();

      if (!program || !raceNumber) continue;

      const key = buildRaceKey(meet.MeetNumber, program, raceNumber);

      if (!seen.has(key)) {
        seen.set(key, { program, raceNumber });
      }
    }

    return Array.from(seen.entries())
      .map(([key, value]) => ({
        key,
        program: Number(value.program),
        raceNumber: Number(value.raceNumber),
      }))
      .sort((a, b) => {
        if (a.program !== b.program) return a.program - b.program;
        return a.raceNumber - b.raceNumber;
      })
      .map((race) => ({
        ...race,
        program: String(race.program),
        raceNumber: String(race.raceNumber),
      }));
  }, [meet.MeetNumber, meet.raceResults]);

  React.useEffect(() => {
    if (!open || sortedRaces.length === 0) return;
    if (Object.keys(raceDetails).length > 0) return;

    let cancelled = false;

    async function loadRaceDetails()
    {
      try {
        setLoadingRaces(true);
        setRaceError("");

        const loaded = await Promise.all(
          sortedRaces.map(async (race) => {
            const res = await fetch(
              `/api/race_result/by_race/${encodeURIComponent(String(meet.MeetNumber))}/${encodeURIComponent(race.program)}/${encodeURIComponent(race.raceNumber)}`,
              { cache: "no-store" }
            );

            const json = await res.json();

            if (!res.ok || !json.ok) {
              throw new Error(json.error || `Failed to load race ${race.program}-${race.raceNumber}`);
            }

            return [race.key, json.data] as const;
          })
        );

        if (cancelled) return;

        const next: RaceLineupMap = {};

        for (const [key, value] of loaded) {
          next[key] = value;
        }

        setRaceDetails(next);
      } catch (err) {
        if (cancelled) return;
        setRaceError(err instanceof Error ? err.message : "Failed to load race details.");
      } finally {
        if (!cancelled) {
          setLoadingRaces(false);
        }
      }
    }

    loadRaceDetails();

    return () => {
      cancelled = true;
    };
  }, [open, sortedRaces, meet.MeetNumber, raceDetails]);

  return (
    <div className="overflow-hidden rounded-xl border border-black/8 bg-white/60">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="min-w-0 flex-1 text-left transition-opacity hover:opacity-80"
        >
          <p className="text-sm font-semibold text-[#12301D]">
            {meet.ClubAbbreviation ?? `Meet ${meet.MeetNumber}`}
            {meet.Location ? (
              <span className="font-normal text-[#12301D]/50"> · {meet.Location}</span>
            ) : null}
          </p>

          {meet.MeetDate ? (
            <p className="mt-0.5 text-xs text-[#12301D]/50">
              {formatDate(meet.MeetDate)}
            </p>
          ) : null}
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/event/${encodeURIComponent(String(meet.MeetNumber))}`}
            className="rounded-full bg-[#2E6B3F] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#245532]"
          >
            View Meet
          </Link>

          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#12301D]/50 transition hover:bg-white"
            aria-label={open ? "Collapse meet details" : "Expand meet details"}
          >
            <svg
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-black/8 px-4 py-3">
          {(meet.meetResults ?? []).length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#12301D]/40">
                Meet Results
              </p>

              {meet.meetResults!.map((result, index) => (
                <div
                  key={index}
                  className="flex flex-wrap gap-x-4 gap-y-1 border-b border-black/5 py-1 text-xs text-[#12301D]/70 last:border-0"
                >
                  {result.MeetPlacement != null && (
                    <span>
                      Place: <b className="text-[#2E6B3F]">#{result.MeetPlacement}</b>
                    </span>
                  )}
                  {result.MeetPoints != null && (
                    <span>
                      Points: <b>{result.MeetPoints}</b>
                    </span>
                  )}
                  {result.ARXEarned ? (
                    <span>
                      ARX: <b>{result.ARXEarned}</b>
                    </span>
                  ) : null}
                  {result.NARXEarned ? (
                    <span>
                      NARX: <b>{result.NARXEarned}</b>
                    </span>
                  ) : null}
                  {result.ShowPoints ? (
                    <span>
                      Show: <b>{result.ShowPoints}</b>
                    </span>
                  ) : null}
                  {result.DPCLeg === 1 ? (
                    <span className="font-semibold text-amber-600">DPC Leg ✓</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {(meet.raceResults ?? []).length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#12301D]/40">
                Race Lineups
              </p>

              {loadingRaces && (
                <p className="text-xs text-[#12301D]/50">Loading race details...</p>
              )}

              {raceError && (
                <p className="text-xs font-medium text-red-600">{raceError}</p>
              )}

              <div className="space-y-3">
                {sortedRaces.map((race) => {
                  const raceKey = race.key;
                  const detail = raceDetails[raceKey];

                  const currentDogRaceRow = (meet.raceResults ?? []).find(
                    (row) =>
                      String(row.Program ?? "").trim() === race.program &&
                      String(row.RaceNumber ?? "").trim() === race.raceNumber
                  );

                  return (
                    <div key={raceKey} className="rounded-xl border border-black/8 bg-white/70 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#12301D]">
                          Program {race.program} · Race {race.raceNumber}
                        </p>

                        {currentDogRaceRow?.Placement != null && (
                          <span className="rounded-full bg-[#2E6B3F]/10 px-2.5 py-1 text-[11px] font-semibold text-[#2E6B3F]">
                            This dog placed #{currentDogRaceRow.Placement}
                          </span>
                        )}
                      </div>

                      {!detail ? (
                        <p className="text-xs text-[#12301D]/50">Loading lineup...</p>
                      ) : (
                        <div className="space-y-1.5">
                          {detail.entries.map((entry) => {
                            const isCurrentDog = entry.cwaNumber === currentCwaNumber;

                            return (
                              <div
                                key={`${raceKey}-${entry.cwaNumber}`}
                                className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-xs ${
                                  isCurrentDog
                                    ? "bg-[#2E6B3F]/10 ring-1 ring-[#2E6B3F]/20"
                                    : "bg-black/5"
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#2E6B3F]">
                                      #{entry.placement ?? "—"}
                                    </span>

                                    <span className="font-semibold text-[#12301D]">
                                      {entry.dogName}
                                    </span>

                                    {isCurrentDog && (
                                      <span className="rounded-full bg-[#2E6B3F]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2E6B3F]">
                                        This Dog
                                      </span>
                                    )}
                                  </div>

                                  {entry.registeredName ? (
                                    <p className="truncate text-[11px] text-[#12301D]/55">
                                      {entry.registeredName}
                                    </p>
                                  ) : null}

                                  <p className="text-[11px] text-[#12301D]/45">
                                    {entry.cwaNumber}
                                  </p>
                                </div>

                                {entry.points != null && (
                                  <span className="whitespace-nowrap font-semibold text-[#2E6B3F]">
                                    {entry.points} pt
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DogPage()
{
  const params = useParams();
  const cwaNumber = decodeURIComponent(String(params.id ?? ""));
  const encodedCwaNumber = encodeURIComponent(cwaNumber);

  const [dog, setDog] = React.useState<DogDetail | null>(null);
  const [meets, setMeets] = React.useState<MeetEntry[]>([]);
  const [owners, setOwners] = React.useState<DogOwner[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!cwaNumber) return;

    setLoading(true);

    fetchJson<{ ok: boolean; data: DogDetail }>(`/api/dog/get/${encodedCwaNumber}`)
      .then((response) => setDog(response.data))
      .catch(() => setDog(null))
      .finally(() => setLoading(false));

    fetchJson<{ ok: boolean; data: MeetEntry[] }>(`/api/dog/meets/${encodedCwaNumber}`)
      .then((response) => setMeets(Array.isArray(response.data) ? response.data : []))
      .catch(() => setMeets([]));

    fetchJson<{ ok: boolean; data: DogOwner[] }>(`/api/dog_owner/owners/${encodedCwaNumber}`)
      .then((response) => setOwners(Array.isArray(response.data) ? response.data : []))
      .catch(() => setOwners([]));
  }, [cwaNumber, encodedCwaNumber]);

  const ageMonths = dog ? calcAgeMonths(dog.birthdate) : null;
  const maxPoints = Math.max(
    dog?.meetPoints ?? 0,
    dog?.arxPoints ?? 0,
    dog?.narxPoints ?? 0,
    dog?.showPoints ?? 0,
    1
  );

  const statusLabel = dog?.status?.trim() || "Status unknown";
  const statusColor = getStatusColor(dog?.status);

  return (
    <main className="min-h-screen bg-[#1F4D2E]">
      <HeroSection
        title={dog?.registeredName || "Dog Profile"}
        subtitle={
          dog?.callName
            ? `"${dog.callName}"`
            : "View dog details, meet history, and performance information."
        }
        topContent={
          <div className="mb-2 mt-16 flex flex-wrap justify-center gap-3">
            <Link
              href="/search"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Back to Search
            </Link>
          </div>
        }
      />

      <section className="bg-[#E7F0E9] pb-24 pt-10">
        <div className="mx-auto max-w-4xl space-y-6 px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill label="Completed Meets" value={dog?.meetAppearences ?? "—"} />
            <StatPill label="Meet Points" value={dog?.meetPoints ?? "—"} accent />
            <StatPill label="Meet Wins" value={dog?.meetWins ?? "—"} />
            <StatPill label="High Combo W" value={dog?.highCombinedWins ?? "—"} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card title="Details" className="h-full lg:col-span-2">
              {loading ? (
                <p className="text-sm text-[#12301D]/40">Loading…</p>
              ) : dog ? (
                <>
                  <FieldRow label="CWA #" value={dog.cwaNumber} />
                  <FieldRow label="Birthdate" value={formatDate(dog.birthdate)} />
                  <FieldRow label="Age" value={ageLabel(ageMonths)} />
                  <FieldRow label="Status" value={dog.status} />
                  <FieldRow label="Current Grade" value={dog.currentGrade} />
                  <FieldRow label="AKC #" value={dog.akcNumber} />
                  <FieldRow label="CKC #" value={dog.ckcNumber} />
                  <FieldRow label="Foreign #" value={dog.foreignNumber} />
                  <FieldRow label="Foreign Type" value={dog.foreignType} />

                  {dog.pedigreeLink ? (
                    <div className="py-2">
                      <a
                        href={dog.pedigreeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#2E6B3F] underline transition hover:text-[#1a4228]"
                      >
                        View Pedigree ↗
                      </a>
                    </div>
                  ) : null}

                  {dog.notes ? (
                    <p className="mt-3 text-xs italic text-[#12301D]/40">
                      {dog.notes}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-[#12301D]/40">No dog found.</p>
              )}
            </Card>

            <Card title="Points Breakdown" className="h-full lg:col-span-3">
              {loading ? (
                <p className="text-sm text-[#12301D]/40">Loading…</p>
              ) : dog ? (
                <>
                  <PointBar label="Meet Pts" value={dog.meetPoints ?? 0} max={maxPoints} />
                  <PointBar label="ARX Pts" value={dog.arxPoints ?? 0} max={maxPoints} />
                  <PointBar label="NARX Pts" value={dog.narxPoints ?? 0} max={maxPoints} />
                  <PointBar label="Show Pts" value={dog.showPoints ?? 0} max={maxPoints} />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className={`rounded-full px-4 py-1 text-xs font-semibold ${statusColor}`}>
                      {statusLabel}
                    </span>

                    <span className="rounded-full bg-black/5 px-4 py-1 text-xs font-semibold text-[#12301D]/70">
                      CWA #{dog.cwaNumber}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#12301D]/40">No points available.</p>
              )}
            </Card>
          </div>

          <Card title={`Owner${owners.length !== 1 ? "s" : ""}${owners.length > 0 ? ` (${owners.length})` : ""}`}>
            {owners.length === 0 ? (
              <p className="py-2 text-center text-sm text-[#12301D]/40">
                No owners on record.
              </p>
            ) : (
              <div className="divide-y divide-black/5">
                {owners.map((owner, index) => {
                  const fullName = [owner.FirstName, owner.LastName].filter(Boolean).join(" ") || "Unknown";

                  return (
                    <div
                      key={owner.PersonID ?? index}
                      className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2E6B3F]">
                        <span className="text-sm font-bold text-white">
                          {(owner.FirstName?.[0] ?? "?").toUpperCase()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#12301D]">
                          {fullName}
                        </p>

                        {owner.EmailAddress ? (
                          <a
                            href={`mailto:${owner.EmailAddress}`}
                            className="block truncate text-xs text-[#2E6B3F] hover:underline"
                          >
                            {owner.EmailAddress}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {dog ? (
            <div>
              <h2 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-[#12301D]">
                Title Progression
              </h2>

              <div className="space-y-3">
                {TITLE_FAMILIES.map((family) => (
                  <TitleFamilyCard key={family.family} family={family} dog={dog} />
                ))}
              </div>
            </div>
          ) : null}

          <Card title={`Meet History${meets.length > 0 ? ` (${meets.length})` : ""}`}>
            {meets.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#12301D]/40">
                No meet records found.
              </p>
            ) : dog ? (
              <div className="space-y-2">
                {meets.map((meet, index) => (
                  <MeetCard
                    key={`${meet.MeetNumber}-${index}`}
                    meet={meet}
                    currentCwaNumber={dog.cwaNumber}
                  />
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-[#12301D]/40">
                No dog loaded.
              </p>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}