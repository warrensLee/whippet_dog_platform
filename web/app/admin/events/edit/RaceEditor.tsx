import { useEffect } from "react";
import { DogRace, validateRace } from "./MeetResultTypes";

export default function RaceEditor({ value, onChange, validate, onRemove, races }: { value: DogRace, onChange: (value: DogRace) => void, validate?: (isValid: boolean) => void, onRemove: () => void, races: DogRace[] }) {
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
                <label className="mb-2 block text-sm font-medium text-[#12301D]">Box</label>
                <input
                    inputMode="numeric"
                    value={value.box ?? ""}
                    onChange={(e) => {
                        const val = e.target.value;

                        if (val === "") {
                            handleFieldChange("box", undefined);
                            return;
                        }

                        if (/^\d+$/.test(val)) {
                            handleFieldChange("box", val);
                        }
                    }}
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