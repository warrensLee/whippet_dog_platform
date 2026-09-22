import { DogEntry, getDefinedRacesForProgram } from "./MeetResultTypes";
import RaceSection from "./RaceSection";
import { useState } from "react";

type ProgramSectionProps = {
    program: string;
    results: DogEntry[];
    definedRaces: { program: string; race: string }[];
    definedPrograms: string[];
    onRaceDogChange: (
        program: string,
        raceNumber: string,
        dog: DogEntry
    ) => void;
    onRaceDogRemove: (
        program: string,
        raceNumber: string,
        dog: DogEntry
    ) => void;
    onAddDogToRace: (program: string, raceNumber: string, cwaNumber: string) => void;
    onAddRace: (program: string) => void;
    onRemoveRace: (program: string, raceNumber: string) => void;
    onRemoveProgram: (program: string) => void;
    onMoveProgram: (program: string, direction: "up" | "down") => void;
    onMoveRace: (program: string, raceNumber: string, direction: "up" | "down") => void;
};

export default function ProgramSection({
    program,
    results,
    definedRaces,
    definedPrograms,
    onRaceDogChange,
    onRaceDogRemove,
    onAddDogToRace,
    onAddRace,
    onRemoveRace,
    onRemoveProgram,
    onMoveProgram,
    onMoveRace,
}: ProgramSectionProps) {
    const [collapsed, setCollapsed] = useState(false);
    const definedRaceNumbers = getDefinedRacesForProgram(definedRaces, program);
    const programIdx = definedPrograms.indexOf(program);
    const title = `Program ${program}`;

    function getDogsInRace(raceNumber: string): DogEntry[] {
        return results.filter(d =>
            d.races.some(r => r.program === program && r.race === raceNumber)
        );
    }

    return (
        <div className="rounded-2xl border border-black/10 bg-[#F8F9FA] p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
                <h3
                    className="font-bold text-[#12301D] text-lg cursor-pointer select-none hover:text-[#2E6B3F]"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {title} {collapsed ? "▸" : "▾"}
                </h3>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => onMoveProgram(program, "up")}
                        disabled={programIdx <= 0}
                        className="rounded-full w-7 h-7 flex items-center justify-center bg-gray-200 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move program up"
                    >
                        ↑
                    </button>
                    <button
                        onClick={() => onMoveProgram(program, "down")}
                        disabled={programIdx >= definedPrograms.length - 1}
                        className="rounded-full w-7 h-7 flex items-center justify-center bg-gray-200 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move program down"
                    >
                        ↓
                    </button>
                    <button
                        onClick={() => onRemoveProgram(program)}
                        className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                        Delete Program
                    </button>
                    <button
                        onClick={() => onAddRace(program)}
                        className="rounded-full bg-[#2E6B3F] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#255733]"
                    >
                        + Add Race
                    </button>
                </div>
            </div>

            {!collapsed && (
                <>
                    {definedRaceNumbers.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-6">
                            No races in {title.toLowerCase()} yet. Click &quot;+ Add Race&quot; to start.
                        </p>
                    )}

                    {definedRaceNumbers.map((raceNumber, idx) => {
                        const dogsInRace = getDogsInRace(raceNumber);

                        return (
                            <RaceSection
                                key={`${program}-${raceNumber}`}
                                program={program}
                                raceNumber={raceNumber}
                                dogs={dogsInRace}
                                results={results}
                                onRaceDogChange={onRaceDogChange}
                                onRaceDogRemove={onRaceDogRemove}
                                onAddDogToRace={onAddDogToRace}
                                onRemoveRace={onRemoveRace}
                                onMoveRace={onMoveRace}
                                raceIdx={idx}
                                totalRaces={definedRaceNumbers.length}
                            />
                        );
                    })}
                </>
            )}
        </div>
    );
}
