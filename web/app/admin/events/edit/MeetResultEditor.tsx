import { useState, useEffect, useRef } from "react";
import {
    DogEntry,
    MeetResults,
    recalculateAll,
    RaceDefinition,
    addRaceDefinition,
    removeRaceAndRenumber,
    removeProgramAndRenumber,
    swapPrograms,
    swapRaces,
    getDefinedRacesForProgram
} from "./MeetResultTypes";
import RegistrationSection from "./RegistrationSection";
import ProgramSection from "./ProgramSection";
import CalculationsSection from "./CalculationsSection";
import DogSearchDialog, { SearchDogResult } from "./DogSearchDialog";


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
    const [error, setError] = useState<string | null>(null);
    const [adultCalculationError, setAdultCalculationError] = useState(false)
    const [puppyCalculationError, setPuppyCalculationError] = useState(false)
    const [registrationErrors, setRegistrationErrors] = useState(false)
    const [programs, setPrograms] = useState<string[]>([]);
    const [definedRaces, setDefinedRaces] = useState<RaceDefinition[]>([]);

    const prevValueRef = useRef<MeetResults>(value);

    // Initialize programs and defined races from existing data (once when data is available)
    const hasInitializedRef = useRef(false);
    useEffect(() => {
        const update = async () => {
            if (hasInitializedRef.current) return;
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
            hasInitializedRef.current = true;
        }
        update()
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

            setResultsValid(fieldValid && !adultCalculationError && !puppyCalculationError && !registrationErrors);
        }
    }, [value, setResultsValid, adultCalculationError, puppyCalculationError, registrationErrors]);

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
            average: "0",
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
    }

    function handleDogChange(dog: DogEntry) {
        const updated = value.map(d => (d.cwaNumber === dog.cwaNumber ? dog : d));
        onChange(recalculateAll(updated));
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

    function handleRemoveDog(cwaNumber: string) {
        const updated = value.filter(d => d.cwaNumber !== cwaNumber);
        onChange(updated);
    }

    function handleRaceDogRemove(program: string, raceNumber: string, dog: DogEntry) {
        const remainingRaces = dog.races.filter(
            r => !(r.program === program && r.race === raceNumber)
        );
        if (remainingRaces.length === 0) {
            handleRemoveDog(dog.cwaNumber);
        } else {
            handleDogChange({ ...dog, races: remainingRaces });
        }
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

    function handleMoveProgram(program: string, direction: "up" | "down") {
        const idx = programs.indexOf(program);
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= programs.length) return;
        const target = programs[targetIdx];
        const { results: updated, definedPrograms: newPrograms, definedRaces: newRaces } = swapPrograms(value, programs, definedRaces, program, target);
        setPrograms(newPrograms);
        setDefinedRaces(newRaces);
        onChange(updated);
    }

    function handleMoveRace(program: string, raceNumber: string, direction: "up" | "down") {
        const programRaces = getDefinedRacesForProgram(definedRaces, program);
        const idx = programRaces.indexOf(raceNumber);
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= programRaces.length) return;
        const targetRace = programRaces[targetIdx];
        const { results: updated, definedRaces: newRaces } = swapRaces(value, definedRaces, program, raceNumber, targetRace);
        setDefinedRaces(newRaces);
        onChange(updated);
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8F9FA]">
            <RegistrationSection results={value} onChange={handleDogChange} onRemoveDog={handleRemoveDog} setHasErrors={setRegistrationErrors} />

            <div className="p-4">
                <button
                    onClick={() => {
                        setSearchOpen(true);
                    }}
                    className="rounded-full bg-[#2E6B3F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#255733] w-full"
                >
                    + Add Dogs to Meet
                </button>
            </div>

            <div className="px-5 pt-2">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#12301D] text-lg">Programs</h3>

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
                    definedPrograms={programs}
                    onRaceDogChange={handleRaceDogChange}
                    onRaceDogRemove={handleRaceDogRemove}
                    onAddDogToRace={handleAddDogToRace}
                    onAddRace={handleAddRace}
                    onRemoveRace={handleRemoveRace}
                    onRemoveProgram={handleRemoveProgram}
                    onMoveProgram={handleMoveProgram}
                    onMoveRace={handleMoveRace}
                />
            ))}
            <button
                onClick={handleAddProgram}
                className="w-full rounded-full bg-[#2E6B3F] px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-[#255733]"
            >
                + Add Program
            </button>
            <CalculationsSection title="Final Results" results={value.filter((v) => v.entryType == "REG")} onChange={handleDogChange} onDpcLegChange={handleDpcLegChange} onHcLegChange={handleHcLegChange} setCalculationErrors={setAdultCalculationError} />
            <CalculationsSection title="Puppy Results" results={value.filter((v) => v.entryType == "PUPPY")} onChange={handleDogChange} onDpcLegChange={handleDpcLegChange} onHcLegChange={handleHcLegChange} setCalculationErrors={setPuppyCalculationError} />

            {/* Dog Search Dialog */}
            <DogSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onAddDog={handleAddDog} />

            {error && (
                <div className="m-4 rounded-lg bg-red-50 px-4 py-3 text-red-700 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
