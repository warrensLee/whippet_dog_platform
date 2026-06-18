import { DogEntry } from "./MeetResultTypes";
import { useState, useMemo } from "react";

type RaceSectionProps = {
    program: string;
    raceNumber: string;
    dogs: DogEntry[];
    results: DogEntry[];
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
    onRemoveRace: (program: string, raceNumber: string) => void;
    duplicatePlacements: Set<string>;
};

const INCIDENTS = [
    "",
    "Broken Box",
    "Crossed Wire",
    "Dog Down",
    "False Start",
    "Judging Error",
    "Other",
];

export default function RaceSection({
    program,
    raceNumber,
    dogs,
    results,
    onRaceDogChange,
    onRaceDogRemove,
    onAddDogToRace,
    onRemoveRace,
    duplicatePlacements,
}: RaceSectionProps) {
    const [showAddDog, setShowAddDog] = useState(false);
    const [selectedDogCwa, setSelectedDogCwa] = useState("");

    const inRaceCwaNumbers = useMemo(() => new Set(dogs.map(d => d.cwaNumber)), [dogs]);

    const availableDogs = useMemo(() => results.filter(d => !inRaceCwaNumbers.has(d.cwaNumber)), [results, inRaceCwaNumbers]);

    function getBox(dog: DogEntry): string {
        const race = dog.races.find(r => r.program === program && r.race === raceNumber);
        return race ? (race.box?.toString() ?? "") : "";
    }

    function getPlacement(dog: DogEntry): string | undefined {
        const race = dog.races.find(r => r.program === program && r.race === raceNumber);
        if (!race) return undefined;
        if (race.placement === "AOM") return "AOM";
        return typeof race.placement === "number" ? String(race.placement) : undefined;
    }

    function handlePlacementChange(dog: DogEntry, value: string) {
        const updated = { ...dog };
        const raceIndex = updated.races.findIndex(r => r.program === program && r.race === raceNumber);
        if (raceIndex >= 0) {
            const races = [...updated.races];
            let placement: number | "AOM" | undefined;
            if (value === "AOM") {
                placement = "AOM";
            } else {
                placement = value ? parseInt(value) : undefined;
            }
            races[raceIndex] = { ...races[raceIndex], placement };
            updated.races = races;
        }
        onRaceDogChange(program, raceNumber, updated);
    }

    function getPlacementOptions(): string[] {
        const count = dogs.length;
        const opts: string[] = [];
        for (let i = 1; i <= count; i++) opts.push(String(i));
        opts.push("AOM");
        return opts;
    }

    function getIncident(dog: DogEntry): string {
        const race = dog.races.find(r => r.program === program && r.race === raceNumber);
        return race ? (race.incident ?? "") : "";
    }

    function handleBoxChange(dog: DogEntry, value: string) {
        const updated = { ...dog };
        const raceIndex = updated.races.findIndex(r => r.program === program && r.race === raceNumber);
        if (raceIndex >= 0) {
            const races = [...updated.races];
            races[raceIndex] = { ...races[raceIndex], box: value ? parseInt(value) : undefined };
            updated.races = races;
        }
        onRaceDogChange(program, raceNumber, updated);
    }

    function handleIncidentChange(dog: DogEntry, value: string) {
        const updated = { ...dog };
        const raceIndex = updated.races.findIndex(r => r.program === program && r.race === raceNumber);
        if (raceIndex >= 0) {
            const races = [...updated.races];
            races[raceIndex] = { ...races[raceIndex], incident: value };
            updated.races = races;
        }
        onRaceDogChange(program, raceNumber, updated);
    }

    function handleAddSelectedDog() {
        if (!selectedDogCwa) return;
        onAddDogToRace(program, raceNumber, selectedDogCwa);
        setSelectedDogCwa("");
        setShowAddDog(false);
    }

     return (
        <div className="rounded-xl border border-black/10 bg-white p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[#12301D] text-base">Race {raceNumber}</h4>
                <div className="flex gap-2">
                    <button
                        onClick={() => onRemoveRace(program, raceNumber)}
                        className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                        Delete Race
                    </button>
                    <button
                        onClick={() => {
                            setShowAddDog(!showAddDog);
                            setSelectedDogCwa("");
                        }}
                        className="rounded-full bg-[#2E6B3F] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#255733]"
                    >
                        {showAddDog ? "Cancel" : "+ Add Dog"}
                    </button>
                </div>
            </div>

            {showAddDog && (
                <div className="mb-3">
                    <select
                        value={selectedDogCwa}
                        onChange={(e) => setSelectedDogCwa(e.target.value)}
                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D] outline-none focus:ring-2 focus:ring-[#2E6B3F]/30"
                    >
                        <option value="">Select a dog...</option>
                        {availableDogs.map(dog => (
                            <option key={dog.cwaNumber} value={dog.cwaNumber}>
                                {dog.callName}{dog.callName !== dog.registeredName ? ` (${dog.registeredName})` : ""} — {dog.cwaNumber}
                            </option>
                        ))}
                    </select>
                    {availableDogs.length === 0 && (
                        <p className="mt-2 text-xs text-gray-400">All dogs already in this race</p>
                    )}
                    <button
                        onClick={handleAddSelectedDog}
                        disabled={!selectedDogCwa}
                        className="mt-2 rounded-full bg-[#2E6B3F] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#255733] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add to Race
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-black/10">
                            <th className="text-left py-2 px-2 font-medium text-[#12301D]">Dog</th>
                            <th className="text-left py-2 px-2 font-medium text-[#12301D] w-20">CWA</th>
                            <th className="text-left py-2 px-2 font-medium text-[#12301D] w-16">Box</th>
                            <th className="text-left py-2 px-2 font-medium text-[#12301D] w-20">Place</th>
                            <th className="text-left py-2 px-2 font-medium text-[#12301D]">Incident</th>
                            <th className="text-left py-2 px-2 font-medium text-[#12301D] w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {dogs.length === 0 && !showAddDog && (
                            <tr>
                                <td colSpan={6} className="py-4 text-center text-gray-400 text-sm">
                                    No dogs in this race yet
                                </td>
                            </tr>
                        )}
                        {dogs.map(dog => (
                            <tr key={dog.cwaNumber} className="border-b border-black/5 last:border-0 hover:bg-gray-50">
                                <td className="py-2 px-2">
                                    <span className="font-medium text-[#12301D]">{dog.callName}</span>
                                    {dog.callName !== dog.registeredName && (
                                        <span className="block text-xs text-gray-500">{dog.registeredName}</span>
                                    )}
                                </td>
                                <td className="py-2 px-2 text-xs text-gray-600">{dog.cwaNumber}</td>
                                <td className="py-2 px-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={getBox(dog)}
                                        onChange={(e) => handleBoxChange(dog, e.target.value)}
                                        className="w-14 rounded border border-black/10 px-2 py-1 text-sm text-[#12301D] outline-none focus:ring-2 focus:ring-[#2E6B3F]/30"
                                    />
                                </td>
                                <td className="py-2 px-2">
                                    <select
                                        value={getPlacement(dog)}
                                        onChange={(e) => handlePlacementChange(dog, e.target.value)}
                                        className={`w-full rounded border px-2 py-1 text-sm text-[#12301D] outline-none focus:ring-2 ${duplicatePlacements.has(dog.cwaNumber) ? "border-red-500 focus:ring-red-200" : "border-black/10 focus:ring-[#2E6B3F]/30"}`}
                                    >
                                        {getPlacementOptions().map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="py-2 px-2">
                                    <input
                                        value={getIncident(dog)}
                                        onChange={(e) => handleIncidentChange(dog, e.target.value)}
                                        className="w-full rounded border border-black/10 px-2 py-1 text-sm text-[#12301D] outline-none focus:ring-2 focus:ring-[#2E6B3F]/30"
                                    />
                                </td>
                                <td className="py-2 px-2">
                                    <button
                                        onClick={() => onRaceDogRemove(program, raceNumber, dog)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        ×
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
