import { Select, MenuItem, Checkbox } from "@mui/material";
import { useState, useEffect } from "react";
import { DogEntry, DogRace, validateRace } from "./MeetResultTypes";
import RaceEditor from "./RaceEditor";

export default function DogEditor({ value, onChange, validate, onRemove, onHCWinnerChange }: { value: DogEntry, onChange: (value: DogEntry) => void, validate?: (isValid: boolean) => void, onRemove: () => void, onHCWinnerChange?: (cwaNumber: string, hcWinner: boolean) => void }) {
    const [expanded, setExpanded] = useState(true)
    const racesValid = value.races.length === 0 || value.races.every(race => validateRace(race, value.races));
    const shownValidation = !value.shown || ((value.showPlace == "" || (Number(value.showPlace) >= 0 && /^\d+$/.test(value.showPlace))) && (value.dpcPoints == "" || (Number(value.dpcPoints) >= 0 && /^\d+$/.test(value.dpcPoints))));
    const meetPlacementValid = value.meetPlacement === "" || value.meetPlacement.toUpperCase() === "AOM" || (Number(value.meetPlacement) > 0 && /^\d+$/.test(value.meetPlacement));
    console.log("shownValidation: " + shownValidation)
    const borderColor = (!racesValid || (!shownValidation && value.shown) || !meetPlacementValid) ? "border-red-500" : "border-black/10";

    function handlePropertyChange<K extends keyof DogEntry>(key: K, new_value: DogEntry[K]) {
        const new_object: DogEntry = { ...value }
        new_object[key] = new_value
        onChange(new_object)
    }


    function recalculateMeetPoints(races: DogRace[]): string {
        let newMeetPoints = 0
        for (const x of races) {
            if (x.incident) continue;
            switch (x.placement) {
                case "1":
                    newMeetPoints += 5;
                    break;
                case "2":
                    newMeetPoints += 3;
                    break;
                case "3":
                    newMeetPoints += 2;
                    break;
                case "4":
                    newMeetPoints += 1;
                    break;
                case "AOM":
                    newMeetPoints += 0.5;
                    break;
                default:
                    newMeetPoints += 0;
                    break;
            }
        }
        return String(newMeetPoints)
    }

    function handleMeetPlacementChange(newPlacement: string) {
        const aomEarned = newPlacement.toUpperCase() === "AOM" ? 0.5 : 0;
        onChange({
            ...value,
            meetPlacement: newPlacement,
            aomEarned: aomEarned,
        });
    }

    function handleRaceChange(index: number, newRace: DogRace) {
        const newRaces = [...value.races]
        newRaces[index] = newRace
        const newMeetPoints = recalculateMeetPoints(newRaces)
        onChange({ ...value, races: newRaces, meetPoints: newMeetPoints })
    }

    function addRace() {
        const newRace: DogRace = { program: "", race: "", box: "", placement: "", incident: "" }
        onChange({ ...value, races: [...value.races, newRace] })
    }

    function removeRace(index: number) {
        const newRaces = value.races.filter((_, i) => i !== index)
        onChange({ ...value, races: newRaces })
    }

    useEffect(() => {
        if (validate) {
            validate(racesValid && shownValidation && meetPlacementValid);
        }
    }, [racesValid, shownValidation, meetPlacementValid, validate]);

    return <div className={`rounded-2xl border ${borderColor} bg-white/90 m-2 p-4 shadow-sm`}>
        <div className="flex items-center gap-4 flex-col">
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
            <div className="flex items-center gap-2 flex-row">
                <div>
                    <label className="mb-2 block ${borderColor} text-sm font-medium text-[#12301D]">Entry Type<span className="text-red-500">*</span></label>
                    <Select
                        value={value.entryType}
                        onChange={(e) => handlePropertyChange("entryType", e.target.value)}
                        sx={{
                            width: '100%',
                            height: '48px',
                            borderRadius: '14px',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: !racesValid ? 'red' : 'black' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: !racesValid ? 'red' : 'black' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: !racesValid ? 'red' : '#2E6B3F', borderWidth: '2px' },
                        }}
                        inputProps={{ className: 'px-4 py-3 text-[#12301D]' }}
                    >
                        <MenuItem value="PUPPY">PUPPY</MenuItem>
                        <MenuItem value="REG">REG</MenuItem>
                    </Select>
                </div>
                <span className="text-sm text-[#12301D]">Shown:</span>
                <Checkbox checked={value.shown} onChange={() => {
                    handlePropertyChange("shown", !value.shown)
                }} />
                <span className="text-sm text-[#12301D]">HC Winner:</span>
                <Checkbox checked={value.hcWinner ?? false} onChange={() => {
                    if (onHCWinnerChange) {
                        onHCWinnerChange(value.cwaNumber, !value.hcWinner)
                    }
                }} />
            </div>
            {value.shown && (
                <div className="flex gap-4 mt-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[#12301D]">Show Place</label>
                        <input
                            value={value.showPlace}
                            onChange={(e) => handlePropertyChange("showPlace", e.target.value)}
                            className={`w-full rounded-2xl border ${value.shown && !shownValidation ? 'border-red-500' : 'border-black/10'} bg-white px-4 py-2 text-[#12301D] outline-none focus:ring-4 ${value.shown && !shownValidation ? 'focus:ring-red-200' : 'focus:ring-[#2E6B3F]/20'}`}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[#12301D]">Show Points</label>
                        <input
                            value={value.showPoints}
                            onChange={(e) => handlePropertyChange("showPoints", e.target.value)}
                            className={`w-full rounded-2xl border ${value.shown && !shownValidation ? 'border-red-500' : 'border-black/10'} bg-white px-4 py-2 text-[#12301D] outline-none focus:ring-4 ${value.shown && !shownValidation ? 'focus:ring-red-200' : 'focus:ring-[#2E6B3F]/20'}`}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[#12301D]">DPC Points</label>
                        <input
                            value={value.dpcPoints}
                            onChange={(e) => handlePropertyChange("dpcPoints", e.target.value)}
                            className={`w-full rounded-2xl border ${value.shown && !shownValidation ? 'border-red-500' : 'border-black/10'} bg-white px-4 py-2 text-[#12301D] outline-none focus:ring-4 ${value.shown && !shownValidation ? 'focus:ring-red-200' : 'focus:ring-[#2E6B3F]/20'}`}
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                        <span className="text-sm text-[#12301D]">DPC Leg:</span>
                        <Checkbox checked={value.dpcLeg === "1"} onChange={() => {
                            handlePropertyChange("dpcLeg", value.dpcLeg === "1" ? "" : "1")
                        }} />
                    </div>
                </div>
            )}
            <div className="flex gap-4 mt-3">
                <div>
                    <label className="mb-1 block text-sm font-medium text-[#12301D]">NARX points</label>
                    <input
                        value={value.NARXEarned}
                        onChange={(e) => handlePropertyChange("NARXEarned", e.target.value)}
                        className={`w-full rounded-2xl border ${value.shown && !shownValidation ? 'border-red-500' : 'border-black/10'} bg-white px-4 py-2 text-[#12301D] outline-none focus:ring-4 ${value.shown && !shownValidation ? 'focus:ring-red-200' : 'focus:ring-[#2E6B3F]/20'}`}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[#12301D]">ARX points</label>
                    <input
                        value={value.ARXEarned}
                        onChange={(e) => handlePropertyChange("ARXEarned", e.target.value)}
                        className={`w-full rounded-2xl border ${value.shown && !shownValidation ? 'border-red-500' : 'border-black/10'} bg-white px-4 py-2 text-[#12301D] outline-none focus:ring-4 ${value.shown && !shownValidation ? 'focus:ring-red-200' : 'focus:ring-[#2E6B3F]/20'}`}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[#12301D]">Meet Placement</label>
                    <input
                        value={value.meetPlacement}
                        onChange={(e) => handleMeetPlacementChange(e.target.value)}
                        className={`w-full rounded-2xl border ${!meetPlacementValid ? 'border-red-500' : 'border-black/10'} bg-white px-4 py-2 text-[#12301D] outline-none focus:ring-4 ${!meetPlacementValid ? 'focus:ring-red-200' : 'focus:ring-[#2E6B3F]/20'}`}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-[#12301D]">Meet Points</label>
                    <input
                        value={value.meetPoints}
                        onChange={(e) => handlePropertyChange("meetPoints", e.target.value)}
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
                    />
                </div>
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