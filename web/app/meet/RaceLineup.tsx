"use client";

import Link from "next/link";
import { fetchJson } from "@/lib/ui/fetchJson";
import { Fragment, useEffect, useMemo, useState } from "react";

type RaceLineupEntry = {
    cwaNumber: string;
    dogName: string;
    registeredName: string | null;
    placement: number | null;
    meetPoints: number | null;
    aomEarned: number | null;
    dpcPoints: number | null;
};

type RaceLineupDetail = {
    meetNumber: string;
    program: string;
    raceNumber: string;
    entries: RaceLineupEntry[];
};

type BaseRace = {
    raceNumber: string | number;
    displayRaceNumber?: number;
    program?: string;
    entryCount?: number;
};

function groupEntriesByPlacement(entries: RaceLineupEntry[]) {
    const groups = new Map<string, RaceLineupEntry[]>();

    for (const entry of entries) {
        const key = entry.placement != null ? String(entry.placement) : "—";

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key)!.push(entry);
    }

    return Array.from(groups.entries()).sort((a, b) => {
        const aNum = Number(a[0]);
        const bNum = Number(b[0]);

        if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
            return aNum - bNum;
        }

        if (a[0] === "—") return 1;
        if (b[0] === "—") return -1;

        return a[0].localeCompare(b[0]);
    });
}

export default function RaceLineup({
    meetNumber,
    race,
}: {
    meetNumber: string;
    race: BaseRace;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [detail, setDetail] = useState<RaceLineupDetail | null>(null);
    const [open, setOpen] = useState(false)
    useEffect(() => {
        if (!open || detail) return;

        let cancelled = false;

        async function loadRaceLineup() {
            try {
                setLoading(true);
                setError("");

                const raceNumber = encodeURIComponent(String(race.raceNumber));
                const program = encodeURIComponent(String(race.program ?? ""));

                const res = await fetchJson<{ ok: boolean; data: RaceLineupDetail }>(
                    `/api/meet_result/by_race/${encodeURIComponent(meetNumber)}/${program}/${raceNumber}`
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
    }, [detail, meetNumber, open, race.program, race.raceNumber]);

    const groupedEntries = useMemo(() => {
        return detail ? groupEntriesByPlacement(detail.entries) : [];
    }, [detail]);

    return (
        <div className="overflow-hidden rounded-xl border border-black/8 bg-white/70">
            <button className="flex items-center text-left justify-between w-full p-2" onClick={() => setOpen(!open)}>
                <div>
                    <p className="text-sm font-semibold text-[#12301D]">
                        Race #{race.displayRaceNumber ?? race.raceNumber}
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
            {open && <div className="border-t border-black/8 px-4 py-3">
                {loading ? (
                    <p className="text-xs text-[#12301D]/50">Loading lineup...</p>
                ) : error ? (
                    <p className="text-xs font-medium text-red-600">{error}</p>
                ) : detail && detail.entries.length > 0 ? (
                    <div className="space-y-2">
                        {groupedEntries.map(([placement, entries]) => (<RaceViewer key={placement} placement={placement} entries={entries} detail={detail} />))}
                    </div>
                ) : (
                    <p className="text-xs text-[#12301D]/50">
                        No lineup data available for this race yet.
                    </p>
                )}
            </div>}
        </div>
    );
}

function RaceViewer({ placement, entries, detail }: { placement: string, entries: RaceLineupEntry[], detail: RaceLineupDetail }) {
    return (
        <div
            key={`${detail.program}-${detail.raceNumber}-${placement}`}
            className="rounded-lg bg-black/5 px-3 py-2"
        >
            <div className="flex items-start gap-3">
                <div className="min-w-[3rem] text-sm font-bold text-[#2E6B3F]">
                    {placement === "—" ? "—" : `#${placement} Place`}
                </div>

                <div className="min-w-0 flex-1 text-sm text-[#12301D]">
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                        {entries.map((entry, index) => {
                            return (
                                <Fragment key={entry.cwaNumber}>
                                    <p className="flex"><Link
                                        href={`/dog?id=${encodeURIComponent(entry.cwaNumber)}`}
                                        className="hover:underline font-medium text-[#12301D]"
                                    >
                                        {entry.dogName}
                                    </Link>
                                        {index < entries.length - 1 && (
                                            <span>, </span>
                                        )}
                                    </p>
                                </Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    )

}