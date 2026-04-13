"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HeroSection from "../components/HeroSection";
import InfoCard from "../components/InfoCard";
import FieldRow from "../components/FieldRow";
import StatPill from "../components/StatPill";
import { fetchJson } from "../../lib/ui/fetchJson";
import { formatDate } from "../../lib/ui/formatDate";

/*
    This page is focused on one event/meet record.
    Dog pages handle dog history. This page should stay centered on
    event info, programs, and races.
*/
interface EventDetail {
    meetNumber: string;
    meetDate?: string;
    clubAbbreviation?: string;
    raceSecretary?: string;
    judge?: string;
    location?: string;
    yards?: string | number;
    requestFormLink?: string;
    resultsLink?: string;
    notes?: string;
    status?: string;
}

interface MeetRace {
    meetNumber: string;
    raceNumber: string | number;
    program?: string;
    entryCount?: number;
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

function normalizeEventDetail(e: Record<string, unknown>): EventDetail {
    // Helper to check both camelCase and PascalCase
    const get = (key: string): string => {
        const pascal = key.charAt(0).toUpperCase() + key.slice(1);
        const value = e[key] ?? e[pascal];
        return typeof value === 'string' ? value : "";
    };
    return {
        meetNumber: get("meetNumber"),
        meetDate: get("meetDate"),
        clubAbbreviation: get("clubAbbreviation"),
        raceSecretary: get("raceSecretary"),
        judge: get("judge"),
        location: get("location"),
        yards: get("yards"),
        requestFormLink: get("requestFormLink"),
        resultsLink: get("resultsLink"),
        notes: get("notes"),
        status: get("status"),
    };
}

/*
    Grouping by program makes the page read like a real event schedule
    instead of one flat pile of races.
*/
function groupRacesByProgram(races: MeetRace[]) {
    const groups = new Map<string, MeetRace[]>();

    for (const race of races) {
        const key =
            race.program != null && String(race.program).trim() !== ""
                ? String(race.program)
                : "Unassigned";

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key)!.push(race);
    }

    return Array.from(groups.entries())
        .map(([program, items]) => ({
            program,
            races: [...items].sort((a, b) => {
                const aNum = Number(a.raceNumber);
                const bNum = Number(b.raceNumber);

                if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
                    return aNum - bNum;
                }

                return String(a.raceNumber).localeCompare(String(b.raceNumber));
            }),
        }))
        .sort((a, b) => {
            const aNum = Number(a.program);
            const bNum = Number(b.program);

            if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
                return aNum - bNum;
            }

            if (a.program === "Unassigned") return 1;
            if (b.program === "Unassigned") return -1;

            return a.program.localeCompare(b.program);
        });
}

/*
    Keeping this local for now is fine.
    It is the only real complex interactive piece on this page,
    so leaving it here makes debugging easier before we extract it.
*/
function RaceAccordionCard({ meetNumber, race }: { meetNumber: string; race: MeetRace }) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [detail, setDetail] = React.useState<RaceLineup | null>(null);

    React.useEffect(() => {
        if (!open || detail) return;

        let cancelled = false;

        async function loadRaceLineup() {
            try {
                setLoading(true);
                setError("");

                const raceNumber = encodeURIComponent(String(race.raceNumber));
                const program = encodeURIComponent(String(race.program ?? ""));

                const res = await fetchJson<{ ok: boolean; data: RaceLineup }>(
                    `/api/race_result/by_race/${encodeURIComponent(meetNumber)}/${program}/${raceNumber}`,
                    { credentials: "include" }
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
                            {detail.entries.map((entry) => (
                                <div
                                    key={`${detail.program}-${detail.raceNumber}-${entry.cwaNumber}`}
                                    className="flex items-start justify-between gap-3 rounded-lg bg-black/5 px-3 py-2 text-xs"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[#2E6B3F]">
                                                #{entry.placement ?? "—"}
                                            </span>

                                            <span className="font-semibold text-[#12301D]">
                                                {entry.dogName}
                                            </span>
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

                                    {entry.points != null ? (
                                        <span className="whitespace-nowrap font-semibold text-[#2E6B3F]">
                                            {entry.points} pt
                                        </span>
                                    ) : null}
                                </div>
                            ))}
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

export default function Page() {
    return (<React.Suspense><MeetPage /></React.Suspense>)
}
function MeetPage() {
    const params = useSearchParams();
    const meetNumber = decodeURIComponent(String(params.get("meetNumber")) ?? "");
    const encodedMeetNumber = encodeURIComponent(meetNumber);

    const [event, setEvent] = React.useState<EventDetail | null>(null);
    const [races, setRaces] = React.useState<MeetRace[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const programGroups = React.useMemo(() => groupRacesByProgram(races), [races]);

    React.useEffect(() => {
        let cancelled = false;

        async function loadMeetPage() {
            if (!meetNumber) {
                setError("Missing meet number.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const [eventRes, racesRes] = await Promise.allSettled([
                    fetchJson<{ ok: boolean; data: EventDetail }>(
                        `/api/meet/get/${encodedMeetNumber}`,
                        { credentials: "include" }
                    ),
                    fetchJson<{ ok: boolean; data: MeetRace[] }>(
                        `/api/meet/get/${encodedMeetNumber}/races`,
                        { credentials: "include" }
                    ),
                ]);

                if (cancelled) return;

                if (eventRes.status === "fulfilled") {
                    setEvent(normalizeEventDetail(eventRes.value.data as unknown as Record<string, unknown>));
                } else {
                    setEvent(null);
                    setError(
                        eventRes.reason instanceof Error
                            ? eventRes.reason.message
                            : "Failed to load event."
                    );
                }

                if (racesRes.status === "fulfilled") {
                    setRaces(Array.isArray(racesRes.value.data) ? racesRes.value.data : []);
                } else {
                    setRaces([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadMeetPage();

        return () => {
            cancelled = true;
        };
    }, [meetNumber, encodedMeetNumber]);

    const statusLabel = event?.status?.trim() || "Status unknown";
    const statusColor =
        statusLabel === "Upcoming"
            ? "bg-blue-100 text-blue-700"
            : statusLabel === "Completed"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-neutral-200 text-neutral-600";

    const totalEntries = races.reduce((sum, race) => sum + (race.entryCount ?? 0), 0);

    const heroTitle = loading
        ? "Loading Event..."
        : event?.clubAbbreviation
            ? event.clubAbbreviation
            : event?.meetNumber
                ? `Event ${event.meetNumber}`
                : "Event";

    const heroSubtitle = loading
        ? "Loading event details and related information."
        : event?.meetDate
            ? `${formatDate(event.meetDate)}${event.location ? ` • ${event.location}` : ""}`
            : "View event details, programs, and race information.";

    return (
        <main className="min-h-screen bg-[#1F4D2E]">
            <HeroSection
                title={heroTitle}
                subtitle={heroSubtitle}
                topContent={
                    <div className="mt-16 mb-2 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/search"
                            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            Back to Search
                        </Link>
                    </div>
                }
            />

            <section className="bg-[#E7F0E9] pt-10 pb-24">
                <div className="mx-auto max-w-4xl space-y-6 px-6">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatPill label="Programs" value={programGroups.length} accent />
                        <StatPill label="Races" value={races.length} />
                        <StatPill label="Entries" value={totalEntries} />
                        <StatPill label="Yards" value={event?.yards || "—"} />
                    </div>

                    <InfoCard title="Details">
                        {loading ? (
                            <p className="text-sm text-[#12301D]/40">Loading…</p>
                        ) : event ? (
                            <>
                                <FieldRow label="Meet Number" value={event.meetNumber} />
                                <FieldRow label="Date" value={formatDate(event.meetDate)} />
                                <FieldRow label="Club" value={event.clubAbbreviation} />
                                <FieldRow label="Race Secretary" value={event.raceSecretary} />
                                <FieldRow label="Judge" value={event.judge} />
                                <FieldRow label="Location" value={event.location} />
                                <FieldRow label="Yards" value={event.yards} />
                                <FieldRow label="Status" value={event.status} />

                                {event.requestFormLink ? (
                                    <div className="pt-3">
                                        <a
                                            href={event.requestFormLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-[#2E6B3F] underline transition hover:text-[#1a4228]"
                                        >
                                            View Request Form ↗
                                        </a>
                                    </div>
                                ) : null}

                                {event.resultsLink ? (
                                    <div className="pt-2">
                                        <a
                                            href={event.resultsLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-[#2E6B3F] underline transition hover:text-[#1a4228]"
                                        >
                                            View Results ↗
                                        </a>
                                    </div>
                                ) : null}

                                {event.notes ? (
                                    <p className="mt-3 text-xs italic text-[#12301D]/40">
                                        {event.notes}
                                    </p>
                                ) : null}

                                <div className="mt-4 flex flex-wrap gap-3">
                                    <span className={`rounded-full px-4 py-1 text-xs font-semibold ${statusColor}`}>
                                        {statusLabel}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-[#12301D]/40">No event found.</p>
                        )}
                    </InfoCard>

                    <InfoCard title="Programs & Races">
                        {loading ? (
                            <p className="text-sm text-[#12301D]/40">Loading…</p>
                        ) : programGroups.length > 0 ? (
                            <div className="space-y-4">
                                {programGroups.map((group) => (
                                    <div
                                        key={group.program}
                                        className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm"
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3 border-b border-black/5 pb-3">
                                            <div>
                                                <p className="text-sm font-bold text-[#12301D]">
                                                    {group.program === "Unassigned"
                                                        ? "Unassigned Program"
                                                        : `Program ${group.program}`}
                                                </p>
                                                <p className="mt-1 text-xs text-[#12301D]/50">
                                                    {group.races.length} race{group.races.length === 1 ? "" : "s"}
                                                </p>
                                            </div>

                                            <span className="rounded-full bg-[#EEF3EF] px-3 py-1 text-xs font-semibold text-[#385245]">
                                                {group.races.reduce((sum, race) => sum + (race.entryCount ?? 0), 0)} total entries
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {group.races.map((race, index) => (
                                                <RaceAccordionCard
                                                    key={`${group.program}-${race.raceNumber}-${index}`}
                                                    meetNumber={meetNumber}
                                                    race={race}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[#12301D]/40">
                                No programs or races have been added to this meet yet.
                            </p>
                        )}
                    </InfoCard>

                    {error ? (
                        <InfoCard title="Notice">
                            <p className="text-sm text-red-600">{error}</p>
                        </InfoCard>
                    ) : null}
                </div>
            </section>
        </main>
    );
}