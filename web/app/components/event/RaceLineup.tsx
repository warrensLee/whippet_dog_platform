"use client";

import * as React from "react";
import Link from "next/link";
import { fetchJson } from "@/lib/ui/fetchJson";

type RaceLineupEntry = {
  cwaNumber: string;
  dogName: string;
  registeredName: string | null;
  placement: number | null;
  meetPoints: number | null;
  aomEarned: number | null;
  dpcPoints: number | null;
};

type RaceLineup = {
    meetNumber: string;
    program: string;
    raceNumber: string;
    entries: RaceLineupEntry[];
};

type BaseRace = {
    raceNumber: string | number;
    program?: string;
    entryCount?: number;
};

export default function RaceLineup({
    meetNumber,
    race,
    currentCwaNumber,
}: {
    meetNumber: string;
    race: BaseRace;
    currentCwaNumber?: string;
})
{
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [detail, setDetail] = React.useState<RaceLineup | null>(null);

    React.useEffect(() => {
        if (!open || detail) return;

        let cancelled = false;

        async function loadRaceLineup()
        {
            try {
                setLoading(true);
                setError("");

                const raceNumber = encodeURIComponent(String(race.raceNumber));
                const program = encodeURIComponent(String(race.program ?? ""));

                const res = await fetchJson<{ ok: boolean; data: RaceLineup }>(
                    `/api/race_result/by_race/${encodeURIComponent(meetNumber)}/${program}/${raceNumber}`
                );

                if (!cancelled) {
                    setDetail(res.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load race lineup.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadRaceLineup();

        return () => {
            cancelled = true;
        };
    }, [open, detail, meetNumber, race.program, race.raceNumber]);

    return (
        <div className="overflow-hidden rounded-xl border border-black/8 bg-white/70">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/90"
            >
                <div>
                    <p className="text-sm font-semibold text-[#12301D]">
                        Race #{race.raceNumber}
                    </p>
                    <p className="mt-1 text-xs text-[#12301D]/55">
                        {race.entryCount ?? 0} entries
                    </p>
                </div>

                <svg
                    className={`h-4 w-4 text-[#12301D]/40 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="border-t border-black/8 px-4 py-3">
                    {loading ? (
                        <p className="text-xs text-[#12301D]/50">Loading lineup...</p>
                    ) : error ? (
                        <p className="text-xs font-medium text-red-600">{error}</p>
                    ) : detail && detail.entries.length > 0 ? (
                        <div className="space-y-1.5">
                            {detail.entries.map((entry) => {
                                const isCurrentDog = currentCwaNumber != null && entry.cwaNumber === currentCwaNumber;
                                return (
                                    <div
                                    key={`${detail.program}-${detail.raceNumber}-${entry.cwaNumber}`}
                                    className={`rounded-lg px-3 py-3 text-xs ${
                                        isCurrentDog
                                        ? "bg-[#2E6B3F]/10 ring-1 ring-[#2E6B3F]/20"
                                        : "bg-black/5"
                                    }`}
                                    >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-bold text-[#2E6B3F]">
                                            #{entry.placement ?? "—"}
                                            </span>

                                            <Link
                                            href={`/dog?id=${encodeURIComponent(entry.cwaNumber)}`}
                                            className="text-sm font-semibold text-[#12301D] hover:text-[#2E6B3F] hover:underline"
                                            >
                                            {entry.dogName}
                                            </Link>

                                            {isCurrentDog && (
                                            <span className="rounded-full bg-[#2E6B3F]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2E6B3F]">
                                                This Dog
                                            </span>
                                            )}
                                        </div>

                                        {entry.registeredName ? (
                                            <p className="mt-0.5 truncate text-[11px] text-[#12301D]/55">
                                            {entry.registeredName}
                                            </p>
                                        ) : null}

                                        <Link
                                            href={`/dog?id=${encodeURIComponent(entry.cwaNumber)}`}
                                            className="mt-0.5 inline-block text-[11px] text-[#12301D]/45 hover:text-[#2E6B3F] hover:underline"
                                        >
                                            {entry.cwaNumber}
                                        </Link>
                                        </div>

                                        <div className="shrink-0 text-right">
                                        <span className="inline-flex rounded-full bg-[#2E6B3F] px-2.5 py-1 text-[11px] font-semibold text-white">
                                            {entry.meetPoints ?? 0} pts
                                        </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-2">
                                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-[#12301D]/75">
                                        AOM: {entry.aomEarned ?? 0}
                                        </span>
                                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-[#12301D]/75">
                                        DPC: {entry.dpcPoints ?? 0}
                                        </span>
                                    </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-[#12301D]/50">
                            No lineup data available for this race yet.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}