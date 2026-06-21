import { useState, useEffect, useRef } from "react";
import {
    DogEntry,
    MeetResults,
    recalculateAll,
    RaceDefinition,
    addRaceDefinition,
    removeRaceAndRenumber,
    removeProgramAndRenumber,
} from "./MeetResultTypes";
import RegistrationSection from "./RegistrationSection";
import ProgramSection from "./ProgramSection";
import CalculationsSection from "./CalculationsSection";

type SearchDogResult = {
    cwaNumber: string;
    registeredName: string;
    callName: string;
    grade: string;
};

export default function MeetResultEditor({
    value,
    onChange,
    setResultsValid,
}: {
    value: MeetResults;
    onChange: (results: MeetResults) => void;
    setResultsValid?: (valid: boolean) => void;
}) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchDogResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [programs, setPrograms] = useState<string[]>([]);
    const [definedRaces, setDefinedRaces] = useState<RaceDefinition[]>([]);

    const prevValueRef = useRef<MeetResults>(value);

    // Initialize programs and defined races from existing data (once on mount)
    const hasInitializedRef = useRef(false);
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;
        if (!value || !Array.isArray(value) || value.length === 0) return;

        const existingPrograms = new Set<string>();
        const races: RaceDefinition[] = [];
        for (const dog of value) {
            for (const race of dog.races) {
                if (race.program.trim()) {
                    existingPrograms.add(race.program.trim());
                    races.push({ program: race.program.trim(), race: race.race.trim() });
                }
            }
        }
        const programArray = Array.from(existingPrograms)
            .map(Number)
            .sort((a, b) => a - b)
            .map(String);
        if (programArray.length > 0) {
            setPrograms(programArray);
        }
        if (races.length > 0) {
            setDefinedRaces(races);
        }
    }, [value]);

    // Auto-calculation cascade
    useEffect(() => {
        const prev = prevValueRef.current;
        let changed = false;

        if (prev.length !== value.length) {
            changed = true;
        } else {
            for (let i = 0; i < value.length; i++) {
                const p = prev[i];
                const c = value[i];
                if (p.shown !== c.shown || p.showPlace !== c.showPlace) {
                    changed = true;
                    break;
                }
                if (p.races.length !== c.races.length) {
                    changed = true;
                    break;
                }
                for (let j = 0; j < p.races.length; j++) {
                    const pr = p.races[j];
                    const cr = c.races.find(r => r.cwaNumber === pr.cwaNumber && r.program === pr.program && r.race === pr.race);
                    if (!cr || pr.placement !== cr.placement || pr.incident !== cr.incident) {
                        changed = true;
                        break;
                    }
                }
                if (changed) break;
            }
        }

        if (changed) {
            prevValueRef.current = value;
            onChange(recalculateAll(value));
        } else {
            prevValueRef.current = value;
        }
    }, [value, onChange]);

    // Validation
    useEffect(() => {
        if (setResultsValid) {
            const fieldValid =
                value.length === 0 ||
                value.every(dog => {
                    if (dog.races.length === 0) return true;
                    return dog.races.every(race => {
                        return (
                            race.program.trim() !== "" &&
                            race.race.trim() !== ""
                        );
                    });
                });

            setResultsValid(fieldValid);
        }
    }, [value, setResultsValid]);

    // Dog search
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(`/api/dog/search?q=${encodeURIComponent(searchQuery)}`, {
                cache: "no-store",
                credentials: "include",
            });
            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.ok) throw new Error(json?.error || "Search failed");
            const mapped = (json.items || []).map((item: Record<string, unknown>) => ({
                cwaNumber: String(item.id ?? ""),
                registeredName: String(item.name ?? ""),
                callName: String(item.callName ?? ""),
                grade: String(item.grade ?? ""),
            }));
            setSearchResults(mapped);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Search error";
            console.error("Search error:", msg);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    function handleAddDog(dog: SearchDogResult) {
        const exists = value.some(d => d.cwaNumber === dog.cwaNumber);
        if (exists) {
            setError("This dog is already in the results");
            return;
        }

        const newDog: DogEntry = {
            shown: false,
            callName: dog.callName,
            grade: dog.grade,
            average: 0,
            cwaNumber: dog.cwaNumber,
            registeredName: dog.registeredName,
            showPoints: "",
            entryType: "REG",
            showPlace: "",
            dpcPoints: "",
            NARXEarned: "",
            ARXEarned: "",
            hcLegEarned: false,
            meetPlacement: "",
            meetPoints: "",
            aomEarned: null,
            hcScore: "0",
            dpcLeg: false,
            birthdate: "",
            arxPoints: "0",
            narxPoints: "0",
            dpcTitle: false,
            races: [],
        };

        const updated = [...value, newDog];
        onChange(updated);
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
        setError(null);
    }

    function handleDogChange(dog: DogEntry) {
        const updated = value.map(d => (d.cwaNumber === dog.cwaNumber ? dog : d));
        onChange(updated);
    }

    function handleHcLegChange(dogs: DogEntry[], cwaNumber: string, checked: boolean) {
        const updated = dogs.map(d => ({
            ...d,
            hcLegEarned: d.cwaNumber === cwaNumber ? checked : false,
        }));
        onChange(updated);
    }

    function handleDpcLegChange(dogs: DogEntry[], cwaNumber: string, checked: boolean) {
        const updated = dogs.map(d => ({
            ...d,
            dpcLeg: d.cwaNumber === cwaNumber ? checked : false,
        }));
        onChange(updated);
    }

    function handleAddDogToRace(program: string, raceNumber: string, cwaNumber: string) {
        const dog = value.find(d => d.cwaNumber === cwaNumber);
        if (!dog) {
            setError("Dog not found in results. Add it via Registration section first.");
            return;
        }
        if (dog.races.some(r => r.program === program && r.race === raceNumber)) {
            setError("Dog is already in this race");
            return;
        }
        const dogsInRace = value.filter(d =>
            d.races.some(r => r.program === program && r.race === raceNumber)
        );
        const placements = dogsInRace
            .map(d => {
                const r = d.races.find(r => r.program === program && r.race === raceNumber);
                return r && typeof r.placement === "number" ? r.placement : 0;
            })
            .filter((p): p is number => p > 0);
        const maxPlacement = placements.length > 0 ? Math.max(...placements) : 0;
        const race: DogEntry["races"][0] = {
            program,
            race: raceNumber,
            box: undefined,
            placement: maxPlacement + 1,
            cwaNumber,
            incident: undefined,
        };
        const updated = { ...dog, races: [...dog.races, race] };
        handleDogChange(updated);
    }

    function handleRaceDogRemove(program: string, raceNumber: string, dog: DogEntry) {
        const remainingRaces = dog.races.filter(
            r => !(r.program === program && r.race === raceNumber)
        );
        handleDogChange({ ...dog, races: remainingRaces });
    }

    function handleRaceDogChange(program: string, raceNumber: string, dog: DogEntry) {
        handleDogChange(dog);
    }

    function handleAddRace(program: string) {
        const programRaces = definedRaces.filter(d => d.program === program);
        const raceNumbers = programRaces.map(d => parseInt(d.race));
        const maxRace = raceNumbers.length > 0 ? Math.max(...raceNumbers) : 0;
        const newRaceNumber = String(maxRace + 1);
        setDefinedRaces(prev => addRaceDefinition(prev, program, newRaceNumber));
    }

    function handleAddProgram() {
        const nextNum = programs.length > 0 ? Math.max(...programs.map(Number)) + 1 : 1;
        setPrograms([...programs, String(nextNum)]);
    }

    function handleRemoveRace(program: string, raceNumber: string) {
        const { results: updated, definedRaces: newRaces } = removeRaceAndRenumber(value, program, raceNumber, definedRaces);
        setDefinedRaces(newRaces);
        onChange(updated);
    }

    function handleRemoveProgram(program: string) {
        const { results: updated, definedRaces: newRaces, definedPrograms: newPrograms } = removeProgramAndRenumber(value, program, definedRaces, programs);
        setPrograms(newPrograms);
        setDefinedRaces(newRaces);
        onChange(updated);
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8F9FA]">
            <RegistrationSection results={value} onChange={handleDogChange} />

            <div className="p-4">
                <button
                    onClick={() => {
                        setSearchOpen(true);
                    }}
                    className="rounded-full bg-[#2E6B3F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#255733] w-full"
                >
                    + Add Dog to Meet
                </button>
            </div>

            <div className="px-5 pt-2">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#12301D] text-lg">Programs</h3>
                    <button
                        onClick={handleAddProgram}
                        className="rounded-full bg-[#2E6B3F] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#255733]"
                    >
                        + Add Program
                    </button>
                </div>
            </div>

            {programs.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6 px-5">
                    No programs defined.
                </p>
            )}

            {programs.map(program => (
                <ProgramSection
                    key={program}
                    program={program}
                    results={value}
                    definedRaces={definedRaces}
                    onRaceDogChange={handleRaceDogChange}
                    onRaceDogRemove={handleRaceDogRemove}
                    onAddDogToRace={handleAddDogToRace}
                    onAddRace={handleAddRace}
                    onRemoveRace={handleRemoveRace}
                    onRemoveProgram={handleRemoveProgram}
                />
            ))}

            <CalculationsSection results={value} onChange={handleDogChange} onDpcLegChange={handleDpcLegChange} onHcLegChange={handleHcLegChange} />

            {/* Dog Search Dialog */}
            {searchOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-black/10">
                            <h3 className="font-bold text-[#12301D]">Add Dog</h3>
                            <button
                                onClick={() => {
                                    setSearchOpen(false);
                                    setSearchQuery("");
                                    setSearchResults([]);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#12301D]">
                                        Search by Name, Call Name, or CWA ID
                                    </label>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={() => {
                                            handleSearch();
                                        }}
                                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {searchResults.map(dog => (
                                        <button
                                            key={dog.cwaNumber}
                                            onClick={() => handleAddDog(dog)}
                                            className="w-full text-left rounded-lg border border-black/10 bg-white p-3 transition hover:bg-gray-50 mb-2"
                                        >
                                            <div className="font-semibold text-[#12301D]">{dog.registeredName}</div>
                                            {dog.callName && (
                                                <div className="text-sm text-gray-500">
                                                    Call: {dog.callName}
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-500">
                                                CWA: {dog.cwaNumber}
                                            </div>
                                            {dog.grade && (
                                                <div className="text-sm text-gray-500">
                                                    Grade: {dog.grade}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    {searchResults.length === 0 && searchQuery && !searching && (
                                        <div className="text-center text-gray-400 py-4 text-sm">No dogs found</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="m-4 rounded-lg bg-red-50 px-4 py-3 text-red-700 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
