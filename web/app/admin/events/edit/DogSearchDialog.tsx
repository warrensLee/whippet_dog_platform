import { Dialog, DialogTitle, Typography, IconButton, DialogContent, DialogActions } from "@mui/material";
import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
export type DogSearchResult = {
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
export default function DogSearchDialog({
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