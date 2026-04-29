import { Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography, Select, MenuItem } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { DogEntry, DogRace, MeetResults } from "./MeetResultTypes";
import { useState, useEffect } from "react";

type DogSearchResult = {
    id: string;
    cwaNumber: string;
    registeredNumber: string;
    registeredName: string;
    callName: string;
    birthYear: string;
    status: string;
    ownerName: string;
    title: string;
    grade: string;
    average: number;
};

function DogSearchDialog({
    open,
    onClose,
    onSelect,
}: {
    open: boolean;
    onClose: () => void;
    onSelect: (dog: DogSearchResult) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<DogSearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            const usp = new URLSearchParams();
            usp.set('q', searchQuery);
            const res = await fetch(`/api/dog/search?${usp.toString()}`, {
                cache: 'no-store',
                credentials: 'include',
            });

            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.ok) {
                throw new Error(json?.error || `Request failed (${res.status})`);
            }

            const mappedItems = Array.isArray(json.items)
                ? json.items.map((item: Record<string, unknown>) => {
                    return {
                        id: String(item.id ?? ''),
                        cwaNumber: String(item.id ?? ''),
                        registeredName: String(item.name ?? ''),
                        callName: String(item.callName),
                        birthYear: item.year ? String(item.year) : '',
                        status: String(item.active ?? ''),
                        ownerName: String(item.ownerName ?? ''),
                        title: String(item.title ?? ''),
                        grade: String(item.grade ?? ''),
                        average: Number(item.average ?? 0),
                    } as DogSearchResult;
                })
                : [];

            setSearchResults(mappedItems);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (dog: DogSearchResult) => {
        setSearchQuery("")
        setSearchResults([]);
        onSelect(dog);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">Add Dog</Typography>
                <IconButton onClick={onClose} size="small" sx={{ ml: 'auto' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#12301D]">
                            Search by Registered Name, Call Name, or CWAID
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); handleSearch(); }}
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {searchResults.map((dog) => (
                            <div
                                key={dog.id}
                                onClick={() => handleSelect(dog)}
                                className="cursor-pointer rounded-lg border border-black/10 bg-white p-3 transition hover:bg-gray-50"
                            >
                                <Typography variant="body1" className="font-semibold text-[#12301D]">
                                    {dog.registeredName}
                                </Typography>
                                {dog.callName && (
                                    <Typography variant="body2" color="text.secondary">
                                        Call Name: {dog.callName}
                                    </Typography>
                                )}
                                <Typography variant="body2" color="text.secondary">
                                    CWAID: {dog.cwaNumber}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {dog.registeredName}
                                </Typography>
                            </div>
                        ))}
                    </div>

                    {searchResults.length === 0 && searchQuery && !loading && (
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            No dogs found
                        </Typography>
                    )}
                </div>
            </DialogContent>
            <DialogActions>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition"
                >
                    Cancel
                </button>
            </DialogActions>
        </Dialog>
    );
}

function validateRace(race: DogRace, allRaces: DogRace[]): boolean {
    if (!allRaces) {
        return race.program.trim() !== "" &&
            race.race.trim() !== "" &&
            race.placement !== "" &&
            race.box !== "" &&
            race.entryType !== "" &&
            Number(race.placement) !== 0 &&
            Number(race.box) !== 0;
    }
    const raceIndex = allRaces.indexOf(race);
    const otherRaces = allRaces.filter((_, i) => i !== raceIndex);
    const hasDuplicate = otherRaces.some(otherRace => 
        otherRace.program === race.program && otherRace.race === race.race
    );
    if (hasDuplicate) {
        return false;
    }
    return race.program.trim() !== "" &&
        race.race.trim() !== "" &&
        race.placement !== "" &&
        race.box !== "" &&
        race.entryType !== "" &&
        Number(race.placement) !== 0 &&
        Number(race.box) !== 0;
}

function RaceEditor({ value, onChange, validate, onRemove, races }: { value: DogRace, onChange: (value: DogRace) => void, validate?: (isValid: boolean) => void, onRemove: () => void, races: DogRace[] }) {
    const isValid = validateRace(value, races);

    useEffect(() => {
        if (validate) {
            validate(isValid);
        }
    }, [isValid, validate, races, value]);

    function handleFieldChange<K extends keyof DogRace>(key: K, new_value: DogRace[K]) {
        const new_object: DogRace = { ...value }
        new_object[key] = new_value
        onChange(new_object)
    }

    const borderColor = !isValid ? "border-red-500" : "border-black/10";
    const ringColor = !isValid ? "focus:ring-red-200" : "focus:ring-[#2E6B3F]/20";

    return <div className={`ml-4 mt-2 p-4 rounded-2xl border ${borderColor} bg-white`} >
        <div className="flex gap-3">
            <div>
                <label className="mb-2 block text-sm font-medium text-[#12301D]">Program <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    maxLength={1}
                    required
                    value={value.program}
                    onChange={(e) => handleFieldChange("program", e.target.value)}
                    className={`w-full rounded-2xl border ${borderColor} bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 ${ringColor}`}
                />
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-[#12301D]">Race <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    required
                    value={value.race}
                    onChange={(e) => handleFieldChange("race", e.target.value)}
                    className={`w-full rounded-2xl border ${borderColor} bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 ${ringColor}`}
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-[#12301D]">Box<span className="text-red-500">*</span></label>
                <input
                    type="number"
                    value={value.box}
                    required
                    onChange={(e) => handleFieldChange("box", e.target.value)}
                    className={`w-full rounded-2xl border ${borderColor} bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 ${ringColor}`}
                />
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-[#12301D]">Placement<span className="text-red-500">*</span></label>
                <input
                    type="number"
                    value={value.placement}
                    required
                    onChange={(e) => handleFieldChange("placement", e.target.value)}
                    className={`w-full rounded-2xl border ${borderColor} bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 ${ringColor}`}
                />
            </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
            <div>
                <label className="mb-2 block ${borderColor} text-sm font-medium text-[#12301D]">Entry Type<span className="text-red-500">*</span></label>
                <Select
                    value={value.entryType}
                    onChange={(e) => handleFieldChange("entryType", e.target.value)}
                    sx={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '14px',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: !isValid ? 'red' : 'black' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: !isValid ? 'red' : 'black' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: !isValid ? 'red' : '#2E6B3F', borderWidth: '2px' },
                    }}
                    inputProps={{ className: 'px-4 py-3 text-[#12301D]' }}
                >
                    <MenuItem value="PUPPY">PUPPY</MenuItem>
                    <MenuItem value="REG">REG</MenuItem>
                </Select>
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-[#12301D]">Incident</label>
                <input
                    type="text"
                    value={value.incident}
                    onChange={(e) => handleFieldChange("incident", e.target.value)}
                    className={`w-full rounded-2xl border ${borderColor} bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 ${ringColor}`}
                />
            </div>
        </div>
        <button
            onClick={onRemove}
            className="mt-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
            Remove
        </button>
    </div>
}

function DogEditor({ value, onChange, validate, onRemove }: { value: DogEntry, onChange: (value: DogEntry) => void, validate?: (isValid: boolean) => void, onRemove: () => void }) {
    const [expanded, setExpanded] = useState(true)
    const racesValid = value.races.length === 0 || value.races.every(race => validateRace(race, value.races));
    const shownValidation = !value.shown || (value.showPlace !== undefined && Number(value.showPlace) > 0 && value.showPoints !== undefined && Number(value.showPoints) >= 0);
    const borderColor = (!racesValid || (!shownValidation && value.shown)) ? "border-red-500" : "border-black/10";

    function handlePropertyChange<K extends keyof DogEntry>(key: K, new_value: DogEntry[K]) {
        const new_object: DogEntry = { ...value }
        new_object[key] = new_value
        onChange(new_object)
    }

    function handleRaceChange(index: number, newRace: DogRace) {
        const newRaces = [...value.races]
        newRaces[index] = newRace
        onChange({ ...value, races: newRaces })
    }

    function addRace() {
        const newRace: DogRace = { program: "", race: "", entryType: "", box: "", placement: "", incident: "" }
        onChange({ ...value, races: [...value.races, newRace] })
    }

    function removeRace(index: number) {
        const newRaces = value.races.filter((_, i) => i !== index)
        onChange({ ...value, races: newRaces })
    }

    useEffect(() => {
        if (validate) {
            validate(racesValid && shownValidation);
        }
    }, [racesValid, shownValidation, validate]);

    return <div className={`rounded-2xl border ${borderColor} bg-white/90 m-2 p-4 shadow-sm`}>
        <div className="flex items-center gap-4">
            <div>
                <p className="text-base font-semibold text-[#12301D]">{value.callName}</p>
            </div>
            <div className="flex items-center gap-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-[#12301D]">Grade: {value.grade}</label>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[#12301D]">Average: {value.average}</label>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-[#12301D]">Shown:</span>
                <Checkbox checked={value.shown} onChange={() => {
                    handlePropertyChange("shown", !value.shown)
                }} />
                {value.shown && (
                    <div className="flex gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[#12301D]">Show Place <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                value={value.showPlace}
                                onChange={(e) => handlePropertyChange("showPlace", e.target.value)}
                                className={`w-full rounded-2xl border ${value.shown && !shownValidation ? 'border-red-500' : 'border-black/10'} bg-white px-4 py-2 text-[#12301D] outline-none focus:ring-4 ${value.shown && !shownValidation ? 'focus:ring-red-200' : 'focus:ring-[#2E6B3F]/20'}`}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[#12301D]">Show Points <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                value={value.showPoints}
                                onChange={(e) => handlePropertyChange("showPoints", e.target.value)}
                                className={`w-full rounded-2xl border ${value.shown && !shownValidation ? 'border-red-500' : 'border-black/10'} bg-white px-4 py-2 text-[#12301D] outline-none focus:ring-4 ${value.shown && !shownValidation ? 'focus:ring-red-200' : 'focus:ring-[#2E6B3F]/20'}`}
                            />
                        </div>
                    </div>
                )}
            </div>

        </div>
        <div className="gap-3 flex">
            <button
                onClick={() => setExpanded(!expanded)}
                className="mt-4 rounded-full bg-[#2E6B3F] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#255733]"
            >
                {expanded ? "Collapse Races" : "Expand Races"}
            </button>
            <button
                className="mt-4 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                onClick={onRemove}
            >
                Remove
            </button>
        </div>
        {expanded && (
            <div className="mt-4">
                <h4 className="mb-3 text-sm font-semibold text-[#12301D]">Races</h4>
                {value.races.map((race, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                        <RaceEditor value={race} onRemove={() => removeRace(index)} onChange={(newRace) => handleRaceChange(index, newRace)} races={value.races} validate={(isValid) => {
                            const currentValidity = value.races.map((r, i) => i === index ? isValid : validateRace(r, value.races)).every(v => v);
                            if (validate) {
                                validate(currentValidity);
                            }
                        }} />
                    </div>
                ))}
                <button
                    onClick={addRace}
                    className="mt-2 rounded-full bg-[#2E6B3F] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#255733]"
                >
                    Add Race
                </button>
            </div>
        )}
    </div>
}

export default function MeetResultEditor({ value, onChange, setResultsValid }: { value: MeetResults, onChange: (results: MeetResults) => void, setResultsValid?: (valid: boolean) => void }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const allValid = value.length === 0 || value.every(dog => dog.races.length === 0 || dog.races.every(race => validateRace(race)));

    function handleDogChange(new_value: DogEntry) {
        const new_object: MeetResults = [...value];
        const object_idx = new_object.findIndex((x) => x.cwaNumber == new_value.cwaNumber);
        new_object[object_idx] = new_value
        onChange(new_object)
    }

    function handleRemoveDog(dog: DogEntry) {
        let new_object: MeetResults = [...value];
        new_object = new_object.filter((x) => x.cwaNumber != dog.cwaNumber);
        onChange(new_object)
    }

    function handleAddDog(dog: DogSearchResult) {
        const alreadyExists = value.some(entry => entry.cwaNumber === dog.cwaNumber);
        if (alreadyExists) {
            setError('This dog already exists in the results');
            return;
        }
        const newDogEntry: DogEntry = {
            shown: false,
            callName: dog.callName,
            cwaNumber: dog.cwaNumber,
            registeredName: dog.registeredName,
            showPoints: "",
            showPlace: "",
            grade: dog.grade,
            average: dog.average,
            races: [],
        };
        const newMeetResults: MeetResults = [...value, newDogEntry];
        onChange(newMeetResults);
        setDialogOpen(false);
        setError(null);
    }

    useEffect(() => {
        if (setResultsValid) {
            setResultsValid(allValid);
        }
    }, [allValid, setResultsValid]);

    return (
        <div
            className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8FBF9] align-center justify-center flex-column" >


            {
                value.map((entry) => {
                    return <DogEditor key={entry.cwaNumber} value={entry} onChange={(value: DogEntry) => { handleDogChange(value) }} onRemove={() => handleRemoveDog(entry)} validate={(isValid) => {
                        if (setResultsValid) {
                            const newAllValid = value.some((dog, idx) => idx === value.findIndex(d => d.cwaNumber === entry.cwaNumber) ? isValid : dog.races.every(r => validateRace(r)));
                            setResultsValid(newAllValid);
                        }
                    }} />
                })
            }
            <DogSearchDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleAddDog}
            />
            <button
                onClick={() => setDialogOpen(true)}
                className="m-4 rounded-full bg-[#2E6B3F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#255733] w-[95%]"
            >
                Add Dog
            </button>
            {error && (
                <div className="m-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">
                    {error}
                </div>
            )}
        </div>
    )
}