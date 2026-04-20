"use client";

import * as React from "react";
import type {
    MeetRaceSummary,
    EditableRaceEntry,
    MeetResultRow,
} from "@/app/admin/events/types";

type MeetRaceEditorProps = {
    meetNumber: string;
    raceSummaries: MeetRaceSummary[];
    raceEntriesByKey: Record<string, EditableRaceEntry[]>;
    meetResultsByDog: Record<string, MeetResultRow>;
    expandedRaces: Record<string, boolean>;
    onToggleRace: (raceKey: string) => void;
    onChangeEntry: (
        raceKey: string,
        cwaNumber: string,
        field: keyof EditableRaceEntry,
        value: string
    ) => void;
    onSaveEntry: (entry: EditableRaceEntry) => Promise<void>;
    savingRaceKey: string;
    loading: boolean;
    error: string;
};

function getRaceKey(meetNumber: string, program: string, raceNumber: string) {
    return `${meetNumber}__${program}__${raceNumber}`;
}

export default function MeetRaceEditor({
    meetNumber,
    raceSummaries,
    raceEntriesByKey,
    meetResultsByDog,
    expandedRaces,
    onToggleRace,
    onChangeEntry,
    onSaveEntry,
    savingRaceKey,
    loading,
    error,
}: MeetRaceEditorProps) {
    if (loading) {
        return <p className="text-sm text-[#12301D]/70">Loading race results...</p>;
    }

    if (error) {
        return <p className="text-sm text-red-700">{error}</p>;
    }

    if (raceSummaries.length === 0) {
        return <p className="text-sm text-[#12301D]/70">No race results found for this meet.</p>;
    }

    return (
        <div className="space-y-4">
            {raceSummaries.map((race) => {
                const raceKey = getRaceKey(meetNumber, race.program, race.raceNumber);
                const expanded = !!expandedRaces[raceKey];
                const entries = raceEntriesByKey[raceKey] || [];

                return (
                    <div
                        key={raceKey}
                        className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8FBF9]"
                    >
                        <button
                            type="button"
                            onClick={() => onToggleRace(raceKey)}
                            className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#12301D]/5"
                        >
                            <div>
                                <div className="text-base font-bold text-[#12301D]">
                                    Program {race.program} - Race {race.raceNumber}
                                </div>
                                <div className="text-sm text-[#12301D]/70">
                                    {race.entryCount} entr{race.entryCount === 1 ? "y" : "ies"}
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-[#2E6B3F]">
                                {expanded ? "Hide" : "Show"}
                            </span>
                        </button>

                        {expanded && (
                            <div className="border-t border-black/10 p-5">
                                {entries.length === 0 ? (
                                    <p className="text-sm text-[#12301D]/70">No entries found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {entries.map((entry) => {
                                            const saveKey = `${entry.meetNumber}__${entry.program}__${entry.raceNumber}__${entry.cwaNumber}`;
                                            const isSaving = savingRaceKey === saveKey;
                                            const meetResult = meetResultsByDog[entry.cwaNumber];

                                            return (
                                                <div
                                                    key={`${raceKey}__${entry.cwaNumber}`}
                                                    className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                                                >
                                                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <div className="font-semibold text-[#12301D]">
                                                                {entry.dogName || entry.cwaNumber}
                                                            </div>
                                                            <div className="text-sm text-[#12301D]/65">
                                                                CWA #{entry.cwaNumber}
                                                            </div>
                                                        </div>

                                                        {meetResult && (
                                                            <div className="text-sm text-[#12301D]/70">
                                                                Grade: <span className="font-medium">{meetResult.grade || "—"}</span>
                                                                {" · "}
                                                                Avg: <span className="font-medium">{meetResult.average || "—"}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                        <label className="block">
                                                            <span className="mb-1 block text-sm font-medium text-[#12301D]">Placement</span>
                                                            <input
                                                                value={entry.placement}
                                                                onChange={(e) =>
                                                                    onChangeEntry(raceKey, entry.cwaNumber, "placement", e.target.value)
                                                                }
                                                                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#2E6B3F]"
                                                            />
                                                        </label>

                                                        <label className="block">
                                                            <span className="mb-1 block text-sm font-medium text-[#12301D]">Box</span>
                                                            <input
                                                                value={entry.box}
                                                                onChange={(e) =>
                                                                    onChangeEntry(raceKey, entry.cwaNumber, "box", e.target.value)
                                                                }
                                                                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#2E6B3F]"
                                                            />
                                                        </label>

                                                        <label className="block">
                                                            <span className="mb-1 block text-sm font-medium text-[#12301D]">Entry Type</span>
                                                            <input
                                                                value={entry.entryType}
                                                                onChange={(e) =>
                                                                    onChangeEntry(raceKey, entry.cwaNumber, "entryType", e.target.value)
                                                                }
                                                                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#2E6B3F]"
                                                            />
                                                        </label>

                                                        <label className="block">
                                                            <span className="mb-1 block text-sm font-medium text-[#12301D]">Incident</span>
                                                            <input
                                                                value={entry.incident}
                                                                onChange={(e) =>
                                                                    onChangeEntry(raceKey, entry.cwaNumber, "incident", e.target.value)
                                                                }
                                                                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#2E6B3F]"
                                                            />
                                                        </label>
                                                    </div>

                                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="text-sm text-[#12301D]/70">
                                                            Meet Points: <span className="font-medium">{entry.meetPoints ?? "—"}</span>
                                                            {" · "}
                                                            AOM: <span className="font-medium">{entry.aomEarned ?? "—"}</span>
                                                            {" · "}
                                                            DPC: <span className="font-medium">{entry.dpcPoints ?? "—"}</span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => void onSaveEntry(entry)}
                                                            disabled={isSaving}
                                                            className="rounded-full bg-[#2E6B3F] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#255733] disabled:opacity-50"
                                                        >
                                                            {isSaving ? "Saving..." : "Save Race Entry"}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}