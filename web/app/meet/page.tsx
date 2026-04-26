"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HeroSection from "../components/ui/HeroSection";
import Card from "../components/ui/Card";
import FieldRow from "../components/ui/FieldRow";
import StatPill from "../components/ui/StatPill";
import { fetchJson } from "../../lib/ui/fetchJson";
import { formatDate } from "../../lib/ui/formatDate";
import RaceLineup from "../components/event/RaceLineup";
import FinalMeetResults from "../components/event/FinalMeetResults";
import MeetSpecialWinners from "../components/event/MeetSpecialWinners";
import authContext from "@/lib/auth/auth";
import Loading from "@/lib/loading";
import RichTextViewer from "@/lib/richtext/RichTextViewer";

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
    publicNotes?: string;
    privateNotes?: string;
}

interface MeetRace {
    meetNumber: string;
    raceNumber: string | number;
    displayRaceNumber?: number;
    program?: string;
    entryCount?: number;
}

interface FinalMeetResult {
    cwaNumber: string;
    place?: number | string | null;
    grade?: string | null;
    callName?: string | null;
    registeredName?: string | null;
    ownerName?: string | null;
    ownerIDs?: string | null;
    meetPoints?: number | string | null;
    scratchDQInfo?: string | null;
    arxEarned?: number | string | null;
    narxEarned?: number | string | null;
    incident?: string | null;
    hcScore?: number | string | null;
    dpcPoints?: number | string | null;
    entryType?: string | null;
    matchPoints?: string;
}

function normalizeEventDetail(e: Record<string, unknown>): EventDetail {
    const getString = (key: string): string => {
        const pascal = key.charAt(0).toUpperCase() + key.slice(1);
        const value = e[key] ?? e[pascal];
        return typeof value === "string" ? value : "";
    };

    const getStringOrNumber = (key: string): string | number | undefined => {
        const pascal = key.charAt(0).toUpperCase() + key.slice(1);
        const value = e[key] ?? e[pascal];

        if (typeof value === "string" || typeof value === "number") {
            return value;
        }

        return undefined;
    };

    return {
        meetNumber: getString("meetNumber"),
        meetDate: getString("meetDate"),
        clubAbbreviation: getString("clubAbbreviation"),
        raceSecretary: getString("raceSecretary"),
        judge: getString("judge"),
        location: getString("location"),
        yards: getStringOrNumber("yards"),
        requestFormLink: getString("requestFormLink"),
        resultsLink: getString("resultsLink"),
        publicNotes: getString("publicNotes"),
        privateNotes: getString("privateNotes"),
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
        .map(([program, items]) => {
            const sorted = [...items].sort((a, b) => {
                const aNum = Number(a.raceNumber);
                const bNum = Number(b.raceNumber);

                if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
                    return aNum - bNum;
                }

                return String(a.raceNumber).localeCompare(String(b.raceNumber));
            });

            const renumbered = sorted.map((race, index) => ({
                ...race,
                displayRaceNumber: index + 1,
            }));

            return {
                program,
                races: renumbered,
            };
        })
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

export default function Page() {
    return (<React.Suspense fallback={<Loading />}> <MeetPage /></React.Suspense >)
}
function MeetPage() {
    const params = useSearchParams();
    const meetNumber = decodeURIComponent(String(params.get("id")) ?? "");
    const encodedMeetNumber = encodeURIComponent(meetNumber);

    const [event, setEvent] = React.useState<EventDetail | null>(null);
    const [races, setRaces] = React.useState<MeetRace[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const programGroups = React.useMemo(() => groupRacesByProgram(races), [races]);
    const user = React.useContext(authContext);

    const [finalMeetResults, setFinalMeetResults] = React.useState<FinalMeetResult[]>([]);

    const isAdmin =
        user !== "NotAuthenticated" &&
        user !== undefined &&
        user.SystemRole === "ADMIN";

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

                const [eventRes, racesRes, resultsRes] = await Promise.allSettled([
                    fetchJson<{ ok: boolean; data: EventDetail }>(
                        `/api/meet/get/${encodedMeetNumber}`,
                        { credentials: "include" }
                    ),
                    fetchJson<{ ok: boolean; data: MeetRace[] }>(
                        `/api/meet/get/${encodedMeetNumber}/races`,
                        { credentials: "include" }
                    ),
                    fetchJson<{ ok: boolean; data: FinalMeetResult[] }>(
                        `/api/meet_result/final_by_meet/${encodedMeetNumber}`,
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

                if (resultsRes.status === "fulfilled") {
                    console.log("final meet results response:", resultsRes.value.data);
                    setFinalMeetResults(Array.isArray(resultsRes.value.data) ? resultsRes.value.data : []);
                } else {
                    console.error("final meet results failed:", resultsRes.reason);
                    setFinalMeetResults([]);
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
                            href="/search/meets"
                            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            Back to Search
                        </Link>

                        {isAdmin && event && (
                            <Link
                                href={`/admin/events/edit?meetNumber=${encodeURIComponent(event.meetNumber)}`}
                                className="rounded-full border border-white/20 bg-[#2E6B3F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245532]"
                            >
                                Edit Event
                            </Link>
                        )}
                    </div>
                }
            />

            <section className="bg-[#E7F0E9] pt-10 pb-24">
                <div className="mx-auto max-w-4xl space-y-6 px-6">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatPill label="Programs" value={programGroups.length} accent />
                        <StatPill label="Races" value={races.length} />
                        <StatPill label="Entries" value={totalEntries} />
                        <StatPill label="Yards" value={event?.yards ?? "—"} />
                    </div>

                    <Card title="Details">
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
                                <FieldRow label="Yards" value={event.yards ?? "—"} />

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

                            </>
                        ) : (
                            <p className="text-sm text-[#12301D]/40">No event found.</p>
                        )}
                    </Card>

                    {event && (
                        <Card title="">
                            <p className="mb-2 text-sm font-semibold text-[#12301D]">Public Notes</p>

                            {event.publicNotes ? (
                                <RichTextViewer text={event.publicNotes} />
                            ) : (
                                <p className="text-sm italic text-[#12301D]/40">No notes available</p>
                            )}

                            {event.privateNotes && (
                                <div className="mt-4 border-t pt-3">
                                    <p className="mb-2 text-sm font-semibold text-[#12301D]">Private Notes</p>
                                    <RichTextViewer text={event.privateNotes} />
                                </div>
                            )}
                        </Card>
                    )}


                    <FinalMeetResults
                        results={finalMeetResults.map((row) => ({
                            CWANumber: row.cwaNumber,
                            Place: row.place,
                            Grade: row.grade,
                            CallName: row.callName,
                            RegisteredName: row.registeredName,
                            OwnerName: row.ownerName,
                            OwnerIDs: row.ownerIDs,
                            MeetPoints: row.meetPoints,
                            ScratchDQInfo: row.scratchDQInfo,
                            ARX: row.arxEarned,
                            NARX: row.narxEarned,
                            Incident: row.incident,
                            EntryType: row.entryType,
                            HCScore: row.hcScore,
                            MatchPoints: row.matchPoints,
                            DPCPoints: row.dpcPoints
                        }))}
                    />

                    <Card title="Programs & Races">
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
                                                <RaceLineup
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
                    </Card>

                    {error ? (
                        <Card title="Notice">
                            <p className="text-sm text-red-600">{error}</p>
                        </Card>
                    ) : null}
                </div>
            </section>
        </main>
    );
}