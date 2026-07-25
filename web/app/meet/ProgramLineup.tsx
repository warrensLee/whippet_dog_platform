import { useState } from "react";
import RaceLineup from "./RaceLineup";
import { DisplayProgram } from "./types";

export default function ProgramLineup({ program, meetNumber }: { program: DisplayProgram, meetNumber: string }) {


    const [open, setOpen] = useState(false)
    return (
        <div
            className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm"
        >
            <button
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setOpen(!open)}
            >
                <div>
                    <p className="text-sm font-bold text-[#12301D]">
                        {program.program === "Unassigned"
                            ? "Unassigned Program"
                            : `Program ${program.program}`}
                    </p>
                    <p className="mt-1 text-xs text-[#12301D]/50">
                        {program.races.length} race{program.races.length === 1 ? "" : "s"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#EEF3EF] px-3 py-1 text-xs font-semibold text-[#385245]">
                        {program.races.reduce((sum, race) => sum + (race.entryCount ?? 0), 0)} total entries
                    </span>
                    <svg
                        className={`h-5 w-5 text-[#12301D]/40 transition-transform ${open ? "rotate-180" : ""}`}
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
                <div className="mt-3 space-y-2">
                    {program.races.map((race, index) => (
                        <RaceLineup
                            key={`${program.program}-${race.raceNumber}-${index}`}
                            meetNumber={meetNumber}
                            race={race}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}