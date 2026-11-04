import { useState } from "react";
import Button from "@/app/components/ui/buttons/Button";

export type SearchDogResult = {
    cwaNumber: string;
    registeredName: string;
    callName: string;
    grade: string;
};

function debounce(fn: () => void) {
    let timer: ReturnType<typeof setTimeout>
    return () => {
        clearTimeout(timer)
        timer = setTimeout(fn, 100)
    }
}
export default function DogSearchDialog({ open, onClose, onAddDog }: { open: boolean, onClose: () => void, onAddDog: (dog: SearchDogResult) => void }) {

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchDogResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [lastDogAdded, setLastDogAdded] = useState<string | undefined>(undefined);





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

    const debouncedSearch = debounce(handleSearch);

    function handleClose() {
        setSearchQuery("")
        setSearchResults([])
        setLastDogAdded(undefined)
        onClose()
    }
    if (!open) {
        return <div></div>
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-black/10">
                    <h3 className="font-bold text-[#12301D]">Add Dog</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                        ×
                    </button>
                </div>
                <div className="p-5 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[#12301D]">
                                Search by Name, Call Name, or CWA ID.
                            </label>
                            {lastDogAdded && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                                Added {lastDogAdded}
                            </div>}
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key == "Enter") {
                                        e.preventDefault()
                                        return
                                    }
                                    debouncedSearch();
                                }}
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
                                autoFocus
                            />
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {searchResults.map(dog => (
                                <button
                                    key={dog.cwaNumber}
                                    onClick={() => {
                                        onAddDog(dog)
                                        setLastDogAdded(dog.callName)
                                        setSearchQuery("")
                                        setSearchResults([])
                                    }
                                    }
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
                            <Button onClick={handleClose} >Done</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}