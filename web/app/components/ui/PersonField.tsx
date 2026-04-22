import * as React from "react";
import { useState } from "react";

export type PersonSearchResult = {
    personId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
};


export default function PersonField({ value, onChange, readOnly = false }: { value: PersonSearchResult | null | undefined, onChange: (result: PersonSearchResult | undefined) => void, readOnly?: boolean }) {
    const [searchQuery, setSearchQuery] = useState("")
    const [searching, setSearching] = useState(false)
    const [peopleOptions, setPeopleOptions] = useState<PersonSearchResult[]>([])
    const [searchError, setSearchError] = useState("")

    React.useEffect(() => {
        if (value) {
            const name = `${value.firstName || ""} ${value.lastName || ""}`.trim();
            setSearchQuery(name || value.personId);
        } else {
            setSearchQuery("");
        }
    }, [value]);

    async function fetchPeople(query: string) {
        const trimmed = query.trim();

        if (!trimmed) {
            setPeopleOptions([]);
            setSearchError("");
            return;
        }



        setSearching(true);
        setSearchError("");

        try {
            const res = await fetch(
                `/api/person/search?q=${encodeURIComponent(trimmed)}`,
                { credentials: "include" }
            );

            const json = await res.json().catch(() => null);

            if (!json?.ok) {
                setPeopleOptions([]);
                setSearchError("Search failed.");
                return;
            }

            const mapped: PersonSearchResult[] = Array.isArray(json.data)
                ? json.data
                    .map((person: Record<string, unknown>) => ({
                        personId: String(
                            person.id ??
                            person.ID ??
                            person.personId ??
                            person.PersonID ??
                            ""
                        ).trim(),
                        firstName: String(
                            person.firstName ??
                            person.FirstName ??
                            ""
                        ),
                        lastName: String(
                            person.lastName ??
                            person.LastName ??
                            ""
                        ),
                        email: String(
                            person.email ??
                            person.EmailAddress ??
                            person.emailAddress ??
                            ""
                        ),
                    }))
                    .filter((person: PersonSearchResult) => person.personId)
                : [];

            setPeopleOptions(mapped);
        } catch {
            setPeopleOptions([]);
            setSearchError("Search failed.");
        } finally {
            setSearching(false);
        }
    }


    return (

        <div className="relative">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                    if (value != null && value != undefined) onChange(undefined)
                    setSearchQuery(e.target.value);
                    if (!readOnly) {
                        fetchPeople(e.target.value);
                    }
                }}
                placeholder="Search people by name or ID..."
                disabled={readOnly}
                className={`w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20 ${readOnly ? 'cursor-not-allowed bg-gray-100 text-gray-600' : ''}`}
            />

            {!searching && searchQuery.trim() && !readOnly && peopleOptions.length > 0 && (
                <div className="absolute left-0 top-full z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-black/10 bg-white shadow-lg">
                    {peopleOptions.map((person) => (
                        <button
                            key={person.personId}
                            type="button"
                            onClick={() => { onChange(person); setSearching(true) }}
                            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#2E6B3F]/10 disabled:opacity-50"
                        >
                            <div>
                                <p className="text-sm font-semibold text-[#12301D]">
                                    {`${person.firstName || ""} ${person.lastName || ""}`.trim() || person.personId}
                                </p>
                                <p className="text-xs text-[#12301D]/50">
                                    ID: {person.personId}
                                    {person.email ? ` · ${person.email}` : ""}
                                </p>
                            </div>

                            <span className="rounded-full bg-[#2E6B3F] px-3 py-1 text-xs font-semibold text-white">
                                Add
                            </span>
                        </button>
                    ))}
                    {!searching &&
                        searchQuery.trim() &&
                        !searchError &&
                        peopleOptions.length === 0 && (
                            <p className="mt-2 text-xs text-[#12301D]/50">
                                No people found.
                            </p>
                        )}
                </div>
            )}


        </div>

    )
}