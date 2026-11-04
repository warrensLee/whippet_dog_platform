import { DogEntry } from "./MeetResultTypes";
import { useState, useMemo, useRef } from "react";
import { SearchDogResult } from "./DogSearchDialog";
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
    onMoveRace: (program: string, raceNumber: string, direction: "up" | "down") => void;
    raceIdx: number;
    totalRaces: number;
};

export default function RaceSection({
    program,
    raceNumber,
    dogs,
    results,
    onRaceDogChange,
    onRaceDogRemove,
    onAddDogToRace,
    onRemoveRace,
    onMoveRace,
    raceIdx,
    totalRaces,
}: RaceSectionProps) {
    const [showAddDog, setShowAddDog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const inRaceCwaNumbers = useMemo(() => new Set(dogs.map(d => d.cwaNumber)), [dogs]);
    const availableDogs = useMemo(() => results.filter(d => !inRaceCwaNumbers.has(d.cwaNumber)), [results, inRaceCwaNumbers]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return availableDogs;
        const q = searchQuery.toLowerCase();
        return availableDogs.filter(dog =>
            dog.callName.toLowerCase().includes(q) ||
            dog.registeredName.toLowerCase().includes(q) ||
            dog.cwaNumber.includes(q)
        );
    }, [searchQuery, availableDogs]);

    const sortedDogs = useMemo(() =>
        [...dogs].sort((da, db) => {
            const daPlace = Number(da.races.find((r) => r.program === program && r.race === raceNumber)?.placement) || Infinity
            const dbPlace = Number(db.races.find((r) => r.program === program && r.race === raceNumber)?.placement) || Infinity
            return daPlace - dbPlace
        })
        , [dogs, program, raceNumber])

    function getBox(dog: DogEntry): string {
        const race = dog.races.find(r => r.program === program && r.race === raceNumber);
        return race ? (race.box?.toString() ?? "") : "";
    }

    function getPlacement(dog: DogEntry): string | undefined {
        const race = dog.races.find(r => r.program === program && r.race === raceNumber);
        if (!race) return undefined;
        return typeof race.placement === "number" ? String(race.placement) : undefined;
    }

    function handlePlacementChange(dog: DogEntry, value: string) {
        const updated = { ...dog };
        const raceIndex = updated.races.findIndex(r => r.program === program && r.race === raceNumber);
        if (raceIndex >= 0) {
            const races = [...updated.races];
            const placement: number | undefined = value ? parseInt(value) : undefined;
            races[raceIndex] = { ...races[raceIndex], placement };
            updated.races = races;
        }
        onRaceDogChange(program, raceNumber, updated);
    }

    function getPlacementOptions(): string[] {
        const count = dogs.length;
        const opts: string[] = [];
        for (let i = 1; i <= count; i++) opts.push(String(i));
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

    function handleSelectDog(dog: SearchDogResult) {
        onAddDogToRace(program, raceNumber, dog.cwaNumber);
        setSearchQuery("");
    }

    return (
        <div className="rounded-xl border border-black/10 bg-white p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[#12301D] text-base">Race {raceNumber}</h4>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => onMoveRace(program, raceNumber, "up")}
                        disabled={raceIdx <= 0}
                        className="rounded-full w-7 h-7 flex items-center justify-center bg-gray-200 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move race up"
                    >
                        ↑
                    </button>
                    <button
                        onClick={() => onMoveRace(program, raceNumber, "down")}
                        disabled={raceIdx >= totalRaces - 1}
                        className="rounded-full w-7 h-7 flex items-center justify-center bg-gray-200 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move race down"
                    >
                        ↓
                    </button>
                    <button
                        onClick={() => onRemoveRace(program, raceNumber)}
                        className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                        Delete Race
                    </button>
                    <button
                        onClick={() => {
                            setShowAddDog(!showAddDog);
                            setSearchQuery("");
                            if (!showAddDog) {
                                setTimeout(() => searchInputRef.current?.focus(), 0);
                            }
                        }}
                        className="rounded-full bg-[#2E6B3F] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#255733]"
                    >
                        {showAddDog ? "Cancel" : "+ Add Dog"}
                    </button>
                </div>
            </div>

            {showAddDog && (
                <div className="mb-3 relative">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key == "Enter") {
                                e.preventDefault()
                                if (searchResults.length > 0)
                                    handleSelectDog(searchResults[0])
                            }
                        }}
                        placeholder="Search by call name, registered name, or CWA number. Enter quick adds the first result"
                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D] outline-none focus:ring-2 focus:ring-[#2E6B3F]/30"
                    />
                    {searchQuery && searchResults.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-black/10 bg-white shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map((dog, idx) => (
                                <li
                                    key={dog.cwaNumber}
                                    onClick={() => handleSelectDog(dog)}
                                    className={`px-3 py-2 text-sm cursor-pointer transition bg-gray-10 hover:bg-gray-200` + (idx == 0 ? "border-black border-2" : "")}
                                >
                                    <div className="font-medium text-[#12301D]">
                                        {dog.callName}
                                        {dog.callName !== dog.registeredName && (
                                            <span className="text-gray-500 ml-1">({dog.registeredName})</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">CWA: {dog.cwaNumber}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {availableDogs.length === 0 && !searchQuery && (
                        <p className="mt-2 text-xs text-gray-400">All dogs already in this race</p>
                    )}
                    {searchQuery && searchResults.length === 0 && (
                        <p className="mt-2 text-xs text-gray-400">No dogs found</p>
                    )}
                    <button
                        onClick={() => {
                            setShowAddDog(false);
                            setSearchQuery("");
                        }}
                        className="mt-2 rounded-full bg-[#2E6B3F] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#255733]"
                    >
                        Close
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
                        {sortedDogs.map(dog => (
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
                                        className="w-full rounded border border-black/10 px-2 py-1 text-sm text-[#12301D] outline-none focus:ring-2 focus:ring-[#2E6B3F]/30"
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
