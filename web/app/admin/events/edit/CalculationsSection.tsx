import { DogEntry } from "./MeetResultTypes";

type CalculationsSectionProps = {
    results: DogEntry[];
    onChange: (dog: DogEntry) => void;
    onDpcLegChange: (dogs: DogEntry[], cwaNumber: string, checked: boolean) => void;
    onHcLegChange: (dogs: DogEntry[], cwaNumber: string, checked: boolean) => void;
};

export default function CalculationsSection({ results, onChange, onDpcLegChange, onHcLegChange }: CalculationsSectionProps) {
    const sorted = [...results].sort((a, b) => {
        const placeA = parseInt(a.meetPlacement || "999");
        const placeB = parseInt(b.meetPlacement || "999");
        if (placeA !== placeB) return placeA - placeB;
        return parseFloat(b.meetPoints || "0") - parseFloat(a.meetPoints || "0");
    });

    function handlePropChange(dog: DogEntry, key: keyof DogEntry, value: DogEntry[keyof DogEntry]) {
        onChange({ ...dog, [key]: value });
    }

    function handleDpcLegChange(dog: DogEntry, checked: boolean) {
        onDpcLegChange(results, dog.cwaNumber, checked);
    }

    function handleHcLegChange(dog: DogEntry, checked: boolean) {
        onHcLegChange(results, dog.cwaNumber, checked);
    }

    return (
        <div className="rounded-2xl border border-black/10 bg-[#F8F9FA] p-5 mb-4">
            <h3 className="font-bold text-[#12301D] text-lg mb-4">Final Results</h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-black/20">
                            <th className="text-left py-3 px-2 font-semibold text-[#12301D]">Place</th>
                            <th className="text-left py-3 px-2 font-semibold text-[#12301D]">Dog</th>
                            <th className="text-left py-3 px-2 font-semibold text-[#12301D] w-20">Meet Pts</th>
                            <th className="text-left py-3 px-2 font-semibold text-[#12301D] w-20">Show Pts</th>
                            <th className="text-left py-3 px-2 font-semibold text-[#12301D] w-16">ARX</th>
                            <th className="text-left py-3 px-2 font-semibold text-[#12301D] w-16">NARX</th>
                            <th className="text-left py-3 px-2 font-semibold text-[#12301D] w-20">DPC Pts</th>
                            <th className="text-center py-3 px-2 font-semibold text-[#12301D] w-16">DPC Leg</th>
                            <th className="text-center py-3 px-2 font-semibold text-[#12301D] w-16">HC Leg</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={12} className="py-6 text-center text-gray-400 text-sm">
                                    No results to display yet.
                                </td>
                            </tr>
                        )}
                        {sorted.map((dog) => (
                            <tr key={dog.cwaNumber} className="border-b border-black/5 last:border-0 hover:bg-white/50">
                                <td className="py-2 px-2 text-center font-semibold text-[#12301D]">
                                    {dog.meetPlacement || "-"}
                                </td>
                                <td className="py-2 px-2">
                                    <span className="font-medium text-[#12301D]">{dog.callName}</span>
                                    {dog.callName !== dog.registeredName && (
                                        <span className="block text-xs text-gray-500">{dog.registeredName}</span>
                                    )}
                                    <span className={`inline-block ml-1 text-xs px-1.5 py-0.5 rounded ${dog.entryType === "PUPPY" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                                        {dog.entryType}
                                    </span>
                                </td>
                                <td className="py-2 px-2">
                                    <input
                                        type="text"
                                        value={dog.meetPoints}
                                        onChange={(e) => handlePropChange(dog, "meetPoints", e.target.value)}
                                        className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-[#12301D] text-right outline-none focus:ring-2 focus:ring-[#2E6B3F]/30"
                                    />
                                </td>
                                <td className="py-2 px-2">
                                    <input
                                        type="text"
                                        value={dog.showPoints}
                                        onChange={(e) => handlePropChange(dog, "showPoints", e.target.value)}
                                        className={`w-full rounded-lg border px-2 py-1.5 text-sm text-right outline-none focus:ring-2 ${dog.shown ? "border-black/10 bg-white text-[#12301D] focus:ring-[#2E6B3F]/30" : "border-transparent bg-gray-100 text-gray-400"}`}
                                        disabled={!dog.shown}
                                    />
                                </td>
                                <td className="py-2 px-2">
                                    <input
                                        type="text"
                                        value={dog.ARXEarned}
                                        onChange={(e) => handlePropChange(dog, "ARXEarned", e.target.value)}
                                        className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-[#2E6B3F]/30"
                                    />
                                </td>
                                <td className="py-2 px-2">
                                    <input
                                        type="text"
                                        value={dog.NARXEarned}
                                        onChange={(e) => handlePropChange(dog, "NARXEarned", e.target.value)}
                                        className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-[#2E6B3F]/30"
                                    />
                                </td>
                                <td className="py-2 px-2">
                                    <input
                                        type="text"
                                        value={dog.dpcPoints}
                                        onChange={(e) => handlePropChange(dog, "dpcPoints", e.target.value)}
                                        className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-[#12301D] text-right outline-none focus:ring-2 focus:ring-[#2E6B3F]/30"
                                    />
                                </td>
                                <td className="py-2 px-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(dog.dpcLeg)}
                                        onChange={(e) => handleDpcLegChange(dog, e.target.checked)}
                                        className="w-4 h-4 accent-[#2E6B3F]"
                                    />
                                </td>
                                <td className="py-2 px-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(dog.hcLegEarned)}
                                        onChange={(e) => handleHcLegChange(dog, e.target.checked)}
                                        className="w-4 h-4 accent-[#2E6B3F]"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
