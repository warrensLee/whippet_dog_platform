"use client";

import * as React from "react";

type Owner = {
    personId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
};

type PersonSearchResult = {
    personId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
};

function SectionCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="overflow-visible rounded-3xl border border-black/10 bg-white/90 backdrop-blur p-6 md:p-8 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-[#12301D]">{title}</h3>
            <div className="mb-5 h-0.5 w-10 rounded-full bg-[#2E6B3F]/50" />
            {children}
        </div>
    );
}

export default function DogOwnersSection({ cwaNumber }: { cwaNumber: string }) {
    const [owners, setOwners] = React.useState<Owner[]>([]);
    const [loadingOwners, setLoadingOwners] = React.useState(true);

    const [searchQuery, setSearchQuery] = React.useState("");
    const [peopleOptions, setPeopleOptions] = React.useState<PersonSearchResult[]>([]);
    const [searching, setSearching] = React.useState(false);
    const [searchError, setSearchError] = React.useState("");

    const [addingId, setAddingId] = React.useState<string | null>(null);
    const [removingId, setRemovingId] = React.useState<string | null>(null);
    const [actionError, setActionError] = React.useState("");

    const loadOwners = React.useCallback(async () => {
        if (!cwaNumber) return;

        setLoadingOwners(true);
        try {
            const res = await fetch(`/api/dog_owner/owners/${encodeURIComponent(cwaNumber)}`, {
                credentials: "include",
                cache: "no-store",
            });

            const json = await res.json().catch(() => null);

            const mapped: Owner[] =
                json?.ok && Array.isArray(json.data)
                    ? json.data.map((owner: Record<string, unknown>) => ({
                        personId: String(
                            owner.personId ??
                            owner.PersonID ??
                            owner.id ??
                            owner.ID ??
                            ""
                        ).trim(),
                        firstName: String(
                            owner.firstName ??
                            owner.FirstName ??
                            ""
                        ),
                        lastName: String(
                            owner.lastName ??
                            owner.LastName ??
                            ""
                        ),
                        email: String(
                            owner.email ??
                            owner.EmailAddress ??
                            ""
                        ),
                    }))
                    : [];

            setOwners(mapped.filter((owner) => owner.personId));
        } catch {
            setOwners([]);
        } finally {
            setLoadingOwners(false);
        }
    }, [cwaNumber]);

    React.useEffect(() => {
        loadOwners();
    }, [loadOwners]);

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

    async function handleAdd(person: PersonSearchResult) {
        const personId = String(person.personId || "").trim();
        const dogId = String(cwaNumber || "").trim();

        if (!dogId || !personId) {
            setActionError("Missing dog ID or person ID.");
            return;
        }

        setAddingId(personId);
        setActionError("");

        try {
            const res = await fetch("/api/dog_owner/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    cwaId: dogId,
                    personId,
                }),
            });

            const json = await res.json().catch(() => null);

            if (!json?.ok) {
                throw new Error(json?.error || "Failed to add owner.");
            }

            await loadOwners();
            setSearchQuery("");
            setPeopleOptions([]);
            setSearchError("");
        } catch (e) {
            setActionError(e instanceof Error ? e.message : "Failed to add owner.");
        } finally {
            setAddingId(null);
        }
    }

    async function handleRemove(personId: string) {
        const dogId = String(cwaNumber || "").trim();
        const ownerId = String(personId || "").trim();

        if (!dogId || !ownerId) {
            setActionError("Missing dog ID or person ID.");
            return;
        }

        setRemovingId(ownerId);
        setActionError("");

        try {
            const res = await fetch("/api/dog_owner/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    cwaId: dogId,
                    personId: ownerId,
                    confirm: true,
                }),
            });

            const json = await res.json().catch(() => null);

            if (!json?.ok) {
                throw new Error(json?.error || "Failed to remove owner.");
            }

            setOwners((prev) =>
                prev.filter((o) => String(o.personId).trim() !== ownerId)
            );

            await loadOwners();
        } catch (e) {
            setActionError(e instanceof Error ? e.message : "Failed to remove owner.");
        } finally {
            setRemovingId(null);
        }
    }

    const ownerIds = new Set(owners.map((o) => o.personId));

    const filteredOptions = peopleOptions.filter(
        (person) => !ownerIds.has(person.personId)
    );

    return (
        <div className="relative z-30">
            <SectionCard title="Owners">
                {loadingOwners ? (
                    <p className="mb-4 text-sm text-[#12301D]/50">Loading owners...</p>
                ) : owners.length === 0 ? (
                    <p className="mb-4 text-sm text-[#12301D]/50">No owners linked yet.</p>
                ) : (
                    <div className="mb-5 space-y-2">
                        {owners.map((owner) => (
                            <div
                                key={owner.personId}
                                className="flex items-center justify-between rounded-xl border border-black/8 bg-black/[0.02] px-4 py-2.5"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-[#12301D]">
                                        {`${owner.firstName || ""} ${owner.lastName || ""}`.trim() || owner.personId}
                                    </p>
                                    <p className="text-xs text-[#12301D]/50">
                                        ID: {owner.personId}
                                        {owner.email ? ` · ${owner.email}` : ""}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleRemove(owner.personId)}
                                    disabled={removingId === owner.personId}
                                    className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                    {removingId === owner.personId ? "Removing..." : "Remove"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="border-t border-black/8 pt-5">
                    <p className="mb-3 text-sm font-medium text-[#12301D]">Add an owner</p>

                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchQuery(value);
                                fetchPeople(value);
                            }}
                            placeholder="Search people by name or ID..."
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
                        />

                        {searching && (
                            <p className="mt-2 text-xs text-[#12301D]/50">Searching...</p>
                        )}

                        {searchError && (
                            <p className="mt-2 text-xs text-red-600">{searchError}</p>
                        )}

                        {!searching && searchQuery.trim() && filteredOptions.length > 0 && (
                            <div className="absolute left-0 top-full z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-black/10 bg-white shadow-lg">
                                {filteredOptions.map((person) => (
                                    <button
                                        key={person.personId}
                                        type="button"
                                        onClick={() => handleAdd(person)}
                                        disabled={addingId === person.personId}
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
                                            {addingId === person.personId ? "Adding..." : "Add"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {!searching &&
                            searchQuery.trim() &&
                            !searchError &&
                            filteredOptions.length === 0 &&
                            peopleOptions.length > 0 && (
                                <p className="mt-2 text-xs text-[#12301D]/50">
                                    All matching people are already linked.
                                </p>
                            )}

                        {!searching &&
                            searchQuery.trim() &&
                            !searchError &&
                            peopleOptions.length === 0 && (
                                <p className="mt-2 text-xs text-[#12301D]/50">
                                    No people found.
                                </p>
                            )}
                    </div>
                </div>

                {actionError && (
                    <p className="mt-3 text-xs font-medium text-red-600">{actionError}</p>
                )}
            </SectionCard>
        </div>
    );
}