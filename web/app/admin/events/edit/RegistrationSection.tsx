import { DogEntry } from "./MeetResultTypes";

type RegistrationSectionProps = {
    results: DogEntry[];
    onChange: (dog: DogEntry) => void;
};



export default function RegistrationSection({ results, onChange }: RegistrationSectionProps) {

    function getShowPlacementOptions(): string[] {
        const count = results.filter((r) => r.shown).length
        const opts: string[] = [];
        for (let i = 1; i <= count; i++) opts.push(String(i));
        opts.push("AOM1");
        opts.push("AOM2");
        opts.push("AOM3");
        opts.push("N/A");
        return opts;
    }

    function handlePropertyChange(dog: DogEntry, key: keyof DogEntry, value: DogEntry[keyof DogEntry]) {
        if (key === "showPlace" && (value === "" || value === "0")) {
            onChange({ ...dog, showPlace: value as DogEntry["showPlace"], showPoints: "0" });
        } else if (key === "shown" && value === false) {
            onChange({ ...dog, shown: false, showPoints: "0", showPlace: "" });
        } else {
            onChange({ ...dog, [key]: value });
        }
    }

    return (
        <div className="rounded-2xl border border-black/10 bg-[#F8F9FA] p-5 mb-4">
            <h3 className="font-bold text-[#12301D] text-lg mb-4">Registration &amp; Show Results</h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-black/20">
                            <th className="text-left py-3 px-3 font-semibold text-[#12301D]">Dog</th>
                            <th className="text-left py-3 px-3 font-semibold text-[#12301D] w-20">CWA</th>
                            <th className="text-left py-3 px-3 font-semibold text-[#12301D] w-24">Grade</th>
                            <th className="text-left py-3 px-3 font-semibold text-[#12301D] w-28">Entry Type</th>
                            <th className="text-center py-3 px-3 font-semibold text-[#12301D] w-16">Shown</th>
                            <th className="text-left py-3 px-3 font-semibold text-[#12301D] w-20">Show Place</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-6 text-center text-gray-400 text-sm">
                                    No dogs registered for this meet yet.
                                </td>
                            </tr>
                        )}
                        {results.map(dog => (
                            <tr key={dog.cwaNumber} className="border-b border-black/5 last:border-0 hover:bg-white/50">
                                <td className="py-3 px-3">
                                    <span className="font-medium text-[#12301D]">{dog.callName}</span>
                                    {dog.callName !== dog.registeredName && (
                                        <span className="block text-xs text-gray-500">{dog.registeredName}</span>
                                    )}
                                </td>
                                <td className="py-3 px-3 text-xs text-gray-600 font-mono">{dog.cwaNumber}</td>
                                <td className="py-3 px-3 text-gray-700">{dog.grade}</td>
                                <td className="py-3 px-3">
                                    <select
                                        value={dog.entryType}
                                        onChange={(e) => handlePropertyChange(dog, "entryType", e.target.value as "REG" | "PUPPY")}
                                        className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-[#12301D] outline-none focus:ring-2 focus:ring-[#2E6B3F]/30"
                                    >
                                        <option value="PUPPY">PUPPY</option>
                                        <option value="REG">REG</option>
                                    </select>
                                </td>
                                <td className="py-3 px-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={dog.shown}
                                        onChange={(e) => handlePropertyChange(dog, "shown", e.target.checked)}
                                        className="w-4 h-4 accent-[#2E6B3F]"
                                    />
                                </td>
                                <td className="py-3 px-1">
                                    <select
                                        value={dog.shown ? dog.showPlace : "NS"}
                                        disabled={!dog.shown}
                                        onChange={(e) => handlePropertyChange(dog, "showPlace", e.target.value)}
                                        className={"w-full rounded-lg border border-black/10 px-2 py-1.5 text-sm text-[#12301D] outline-none focus:ring-2 focus:ring-[#2E6B3F]/30 " + (dog.shown ? "bg-white" : "bg-gray-100")}
                                    >
                                        {getShowPlacementOptions().map((s) => <option key={s} value={s}>{s}</option>)}
                                        {!dog.shown && <option key="NS" value="NS"></option>}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
