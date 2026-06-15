import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { DogEntry, MeetResults, validateRace, recalculateMeetRankings, calculateArxNarx, calculateDpc, calculateShowPoints } from "./MeetResultTypes";
import { useState, useEffect, useRef } from "react";
import DogEditor from "./DogEditor";

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







export default function MeetResultEditor({ value, onChange, setResultsValid }: { value: MeetResults, onChange: (results: MeetResults) => void, setResultsValid?: (valid: boolean) => void }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const allValid = value.length === 0 || value.every(dog => dog.races.length === 0 || dog.races.every(race => validateRace(race)));


    function handleRecalculatingPoints(new_object: MeetResults, object_idx?: number): MeetResults {
        if (object_idx == undefined || (new_object[object_idx].meetPlacement === value[object_idx].meetPlacement)) new_object = recalculateMeetRankings(new_object);
        if (object_idx == undefined || (new_object[object_idx].NARXEarned === value[object_idx].NARXEarned && new_object[object_idx].ARXEarned === value[object_idx].ARXEarned)) new_object = calculateArxNarx(new_object);
        if (object_idx == undefined || (new_object[object_idx].dpcLeg == value[object_idx].dpcLeg && new_object[object_idx].dpcPoints == value[object_idx].dpcPoints)) new_object = calculateDpc(new_object);
        return new_object

    }

    function handleDogChange(new_value: DogEntry) {
        let new_object: MeetResults = [...value];
        const object_idx = new_object.findIndex((x) => x.cwaNumber == new_value.cwaNumber);
        new_object[object_idx] = new_value
        new_object = handleRecalculatingPoints(new_object, object_idx)
        onChange(new_object)

    }

    function handleRemoveDog(dog: DogEntry) {
        let new_object: MeetResults = [...value];
        new_object = new_object.filter((x) => x.cwaNumber != dog.cwaNumber);
        onChange(new_object)
    }

    function handleHCWinnerChange(cwaNumber: string, hcWinner: boolean) {
        const new_object: MeetResults = value.map(entry => ({
            ...entry,
            hcWinner: entry.cwaNumber === cwaNumber ? hcWinner : false
        }));
        onChange(new_object);
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
            entryType: "REG",
            average: dog.average,
            dpcPoints: "",
            NARXEarned: "",
            ARXEarned: "",
            races: [],
            hcScore: "0",
            hcLegEarned: "0",
            hcWinner: false,
            meetPlacement: "",
            meetPoints: "",
            aomEarned: 0,
            dpcLeg: "",
            birthdate: "",
            arxPoints: "0",
            narxPoints: "0",
            dpcTitle: false,
        };
        const newMeetResults: MeetResults = [...value, newDogEntry];
        onChange(handleRecalculatingPoints(newMeetResults))
        setDialogOpen(false);
        setError(null);
    }

    useEffect(() => {
        if (setResultsValid) {
            setResultsValid(allValid);
        }
    }, [allValid, setResultsValid]);

    const prevMeetPointsRef = useRef<MeetResults>(value);

    useEffect(() => {
        const prevDogs = prevMeetPointsRef.current;
        let changed = false;

        if (prevDogs.length !== value.length) {
            changed = true;
        } else {
            for (let i = 0; i < value.length; i++) {
                const prev = prevDogs[i];
                const curr = value[i];
                if (prev.showPlace !== curr.showPlace) {
                    changed = true;
                    break;
                }
                if (prev.meetPoints !== curr.meetPoints) {
                    changed = true;
                    break;
                }
                if (prev.races.length !== curr.races.length) {
                    changed = true;
                    break;
                }
                for (let j = 0; j < prev.races.length; j++) {
                    const pr = prev.races[j];
                    const cr = curr.races[j];
                    if (pr.placement !== cr.placement || pr.incident !== cr.incident) {
                        changed = true;
                        break;
                    }
                }
                if (changed) break;
            }
        }

        if (changed) {
            prevMeetPointsRef.current = value;

            let recalculated = value.map(dog => {
                if (dog.shown && dog.showPlace) {
                    return { ...dog, showPoints: calculateShowPoints(dog.showPlace) };
                }
                return dog;
            });

            recalculated = recalculateMeetRankings(recalculated);
            recalculated = calculateArxNarx(recalculated);
            recalculated = calculateDpc(recalculated);
            onChange(recalculated);
        }
    }, [value, onChange]);

    return (
        <div
            className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8FBter flex-column" >


            {
                value.map((entry) => {
                    return <DogEditor key={entry.cwaNumber} value={entry} onChange={(value: DogEntry) => { handleDogChange(value) }} onRemove={() => handleRemoveDog(entry)} validate={(isValid) => {
                        if (setResultsValid) {
                            const newAllValid = value.some((dog, idx) => idx === value.findIndex(d => d.cwaNumber === entry.cwaNumber) ? isValid : dog.races.every(r => validateRace(r)));
                            setResultsValid(newAllValid);
                        }
                    }} onHCWinnerChange={handleHCWinnerChange} />
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