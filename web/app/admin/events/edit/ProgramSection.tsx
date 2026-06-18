import { DogEntry, getDefinedRacesForProgram } from "./MeetResultTypes";
import RaceSection from "./RaceSection";
import { useState } from "react";

type ProgramSectionProps = {
    program: string;
    results: DogEntry[];
    definedRaces: { program: string; race: string }[];
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
    duplicatePlacements: Map<string, Set<string>>;
};

export default function ProgramSection({
    program,
    results,
    definedRaces,
    onRaceDogChange,
    onRaceDogRemove,
    onAddDogToRace,
    onAddRace,
    onRemoveRace,
    onRemoveProgram,
    duplicatePlacements,
}: ProgramSectionProps) {
    const [collapsed, setCollapsed] = useState(false);
    const definedRaceNumbers = getDefinedRacesForProgram(definedRaces, program);
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
                <div className="flex gap-2">
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
                            No races in {title.toLowerCase()} yet. Click "+ Add Race" to start.
                        </p>
                    )}

                    {definedRaceNumbers.map(raceNumber => {
                const dogsInRace = getDogsInRace(raceNumber);
                const raceKey = `${program}-${raceNumber}`;
                const raceDuplicates = duplicatePlacements.get(raceKey) || new Set<string>();

                return (
                    <RaceSection
                        key={raceKey}
                        program={program}
                        raceNumber={raceNumber}
                        dogs={dogsInRace}
                        results={results}
                        onRaceDogChange={onRaceDogChange}
                        onRaceDogRemove={onRaceDogRemove}
                        onAddDogToRace={onAddDogToRace}
                        onRemoveRace={onRemoveRace}
                        duplicatePlacements={raceDuplicates}
                    />
                );
            })}
                </>
            )}
        </div>
    );
}
