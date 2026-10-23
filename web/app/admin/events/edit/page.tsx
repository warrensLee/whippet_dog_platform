"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import EventForm from "../EventForm";
import HeroSection from "@/app/components/ui/HeroSection";
import type { EventFormValues } from "@/app/admin/events/types";
import { emptyEventFormValues } from "@/app/admin/events/types";
import { PersonSearchResult } from "@/app/components/ui/PersonField";
import MeetResultEditor from "./MeetResultEditor";
import { MeetResults, DogEntry, toBackendFormat } from "./MeetResultTypes";
import { formatDate } from "@/lib/ui/formatDate";
import AuthGuard from "@/lib/auth/authGuard";
import authContext from "@/lib/auth/auth";
import { Suspense, useCallback, useContext, useEffect, useState } from "react";

function normalizeText(x: unknown): string {
    if (typeof x === "string") {
        return x;
    }

    if (typeof x === "number") {
        return String(x);
    }

    return "";
}

async function fetchPersonById(personId: string): Promise<PersonSearchResult | null> {
    if (!personId) return null;

    try {
        const res = await fetch(`/api/person/get/${encodeURIComponent(personId)}`, {
            credentials: "include",
        });

        const json = await res.json().catch(() => null);

        if (json?.ok && json.data) {
            const person = json.data;
            return {
                personId: String(person.id || person.PersonID || ""),
                firstName: String(person.firstName || person.FirstName || ""),
                lastName: String(person.lastName || person.LastName || ""),
                email: String(person.email || person.emailAddress || ""),
            };
        }
    } catch {
        // Ignore errors, return null
    }

    return null;
}

function toDateInputValue(value?: string) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
type RawEventGetResponse = {
    ok: boolean;
    data?:
    {
        meetNumber?: string;
        clubAbbreviation?: string | null;
        meetDate?: string;
        raceSecretary?: string | null;
        raceSecretaryName?: string | null;
        judge?: string | null;
        judgeName?: string | null;
        location?: string | null;
        yards?: string | null;
        completed?: boolean | null;
        eventMeetCount?: number | null;
        publicNotes?: string | null;
        privateNotes?: string | null;
    };
    error?: string;
};

/*
    Converts backend Event data into the exact EventFormValues shape
    expected by the shared EventForm component.
*/
async function buildFormFromEvent(data: NonNullable<RawEventGetResponse["data"]>): Promise<EventFormValues> {
    const [raceSecretary, judge] = await Promise.all([
        fetchPersonById(data.raceSecretary || ""),
        fetchPersonById(data.judge || "")
    ]);

    return {
        meetNumber: normalizeText(data.meetNumber),
        clubAbbreviation: normalizeText(data.clubAbbreviation),
        meetDate: toDateInputValue(formatDate(data.meetDate)!),
        raceSecretary,
        judge,
        location: normalizeText(data.location),
        yards: normalizeText(data.yards),
        completed: Boolean(data.completed),
        eventMeetCount: Number(data.eventMeetCount ?? 0),
        publicNotes: normalizeText(data.publicNotes),
        privateNotes: normalizeText(data.privateNotes),
    };
}

/*
    Cleans form state before sending it to the backend.

    This keeps trimming logic in one place instead of stuffing it
    directly into the submit handler like a junk drawer.
*/
function buildEditPayload(form: EventFormValues): Record<string, unknown> {
    return {
        meetNumber: form.meetNumber.trim(),
        clubAbbreviation: form.clubAbbreviation.trim(),
        meetDate: form.meetDate ? `${form.meetDate}T00:00:00` : "",
        raceSecretary: form.raceSecretary?.personId || "",
        judge: form.judge?.personId || "",
        location: form.location.trim(),
        yards: form.yards.trim(),
        publicNotes: form.publicNotes.trim(),
        privateNotes: form.privateNotes.trim(),
    };
}

export default function Page() {
    return (<Suspense><EditEventPage /></Suspense>)
}
function EditEventPage() {
    const params = useSearchParams();
    const router = useRouter();

    const meetNumber = String(params.get("meetNumber") ?? "").trim();
    const isNew = meetNumber === "";
    const user = useContext(authContext);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState<EventFormValues>(emptyEventFormValues);
    const [initialForm, setInitialForm] = useState<EventFormValues>(emptyEventFormValues);
    const [entries, setEntries] = useState<MeetResults>([])

    async function saveMeetResults(entriesToSave: MeetResults) {
        const response = await fetch(`/api/meet_result/edit_result_view/${form.meetNumber}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ entries: toBackendFormat(entriesToSave) }),
        });

        const json = await response.json().catch(() => null);

        if (!response.ok || !json?.ok) {
            throw new Error(json?.error || `Save failed (${response.status})`);
        }

        return json;
    }

    useEffect(() => {
        if (!meetNumber) {
            return;
        }
        async function getMeetResults() {
            const meetResponse = await fetch("/api/meet_result/edit_result_view/" + meetNumber);
            const responseJson = await meetResponse.json();
            if (!responseJson.ok) {
                throw new Error(responseJson.error || "Failed to load results")
            }

            const baseDogs: Omit<DogEntry, "races">[] = responseJson.dogs || [];
            const dogMap = new Map<string, DogEntry>();
            for (const base of baseDogs) {
                dogMap.set(base.cwaNumber, {
                    ...base,
                    races: [],
                    showPlace: base.showPlace == "0" ? "N/A" : base.showPlace,
                    showPoints: base.showPoints ? String(base.showPoints) : "",
                    hcLegEarned: !!(base as unknown as { hcLegEarned: number }).hcLegEarned,
                    dpcLeg: base.dpcLeg ? true : false,
                } as DogEntry);
            }

            if (responseJson.races) {
                const raceData = responseJson.races as Record<string, Record<string, Array<{
                    dog: string;
                    box: string;
                    placement: string;
                    incident: string;
                }>>>;
                for (const [program, racesByNumber] of Object.entries(raceData)) {
                    for (const [raceNumber, placements] of Object.entries(racesByNumber)) {
                        for (const placement of placements) {
                            const existing = dogMap.get(placement.dog);
                            if (existing) {
                                existing.races.push({
                                    program: String(program),
                                    race: String(raceNumber),
                                    box: placement.box ? parseInt(placement.box) : undefined,
                                    placement: placement.placement === "AOM" ? "AOM" : (placement.placement ? parseInt(placement.placement) : 1),
                                    cwaNumber: placement.dog,
                                    incident: placement.incident || undefined,
                                });
                            }
                        }
                    }
                }
            }

            setEntries(Array.from(dogMap.values()));
        }


        getMeetResults().catch(err => {
            setError(err instanceof Error ? err.message : "Failed to load results");
        });
    }, [meetNumber]);


    useEffect(
        () => {

            let cancelled = false;

            async function loadEvent() {
                setLoading(true);
                setError("");
                setSuccess("");

                try {
                    const res = await fetch(
                        `/api/meet/get/${encodeURIComponent(meetNumber)}`,
                        {
                            method: "GET",
                            cache: "no-store",
                            credentials: "include",
                        }
                    );

                    const json = (await res.json().catch(
                        () => {
                            return null;
                        }
                    )) as RawEventGetResponse | null;

                    if (!res.ok || !json?.ok || !json.data) {
                        throw new Error(json?.error || "Failed to load Event.");
                    }

                    if (cancelled) {
                        return;
                    }

                    const nextForm = await buildFormFromEvent(json.data);
                    setForm(nextForm);
                    setInitialForm(nextForm);
                }
                catch (e) {
                    if (!cancelled) {
                        setError(
                            e instanceof Error
                                ? e.message
                                : "Failed to load Event."
                        );
                    }
                }
                finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            }

            loadEvent();

            return () => {
                cancelled = true;
            };
        },
        [meetNumber]
    );

    function updateField<K extends keyof EventFormValues>
        (
            key: K,
            value: EventFormValues[K]
        ) {
        setForm(
            (prev) => {
                return {
                    ...prev,
                    [key]: value,
                };
            }
        );
    }

    function handleResetForm() {
        setForm(initialForm);
        setError("");
        setSuccess("");
    }

    const [resultsValid, setResultsValid] = useState(true);

    const handleEntriesChange = useCallback((newEntries: MeetResults) => {
        setEntries(newEntries);
        setError("");
        setSuccess("");
    }, []);

    async function handleSubmit() {
        if (!resultsValid) {
            setError("Please fix validation errors (missing fields) in the meet results before saving.");
            return false;
        }
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = buildEditPayload(form);

            const res = await fetch(
                isNew ? "/api/meet/add" : "/api/meet/edit",
                {
                    method: "POST",
                    headers:
                    {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(payload),
                }
            );

            const json = await res.json().catch(
                () => {
                    return null;
                }
            );

            if (!res.ok || !json?.ok) {
                throw new Error(json?.error || `Save failed (${res.status})`);
            }

            const cleanedForm =
            {
                ...form,
                meetNumber: form.meetNumber.trim(),
                clubAbbreviation: form.clubAbbreviation.trim(),
                meetDate: form.meetDate,
                raceSecretary: form.raceSecretary,
                judge: form.judge,
                location: form.location.trim(),
                yards: form.yards.trim(),
                publicNotes: form.publicNotes.trim(),
                privateNotes: form.privateNotes.trim(),
            };
            await saveMeetResults(entries);

            setForm(cleanedForm);
            setInitialForm(cleanedForm);
            return true;
        }
        catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Failed to save changes."
            );
        }
        finally {
            setSaving(false);
        }
        return false;
    }



    return (
        <AuthGuard>
            <main className="pt-24 bg-[#1F4D2E]">
                <HeroSection
                    title={isNew ? "Add Event" : "Edit Event"}
                    subtitle="Update Event information and results"
                    topContent={
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            <Link
                                href="/admin/events"
                                className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                            >
                                Back to Admin Events
                            </Link>

                            {!isNew && <Link
                                href={`/meet?id=${encodeURIComponent(form.meetNumber || meetNumber)}`}
                                className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                            >
                                View Event Page
                            </Link>}
                        </div>
                    }
                >
                </HeroSection>

                <section className="bg-[#E7F0E9] pt-12 pb-24">
                    <div className="max-w-5xl mx-auto px-4">
                        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-[#12301D]">
                                    Event Information
                                </h2>
                                <div className="mt-1 h-1 w-14 rounded-full bg-[#2E6B3F]/70" />

                                <p className="mt-2 text-sm font-medium text-[#12301D]/70">
                                    <span className="font-bold text-red-600">*</span> Required field
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleResetForm}
                                    disabled={loading || saving}
                                    className="rounded-full border border-[#12301D]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#12301D] transition hover:bg-[#12301D]/5 disabled:opacity-50"
                                >
                                    Reset Changes
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.push("/admin/events")}
                                    disabled={saving}
                                    className="rounded-full border border-[#12301D]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#12301D] transition hover:bg-[#12301D]/5 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-md">
                            <EventForm
                                values={form}
                                onChange={updateField}
                                personLoading={loading}
                                isEditMode={!isNew}
                                canEditPrivateNotes={user !== undefined && user !== "NotAuthenticated" && user.SystemRole === "ADMIN"}
                            />
                            <MeetResultEditor value={entries} onChange={handleEntriesChange} setResultsValid={setResultsValid} />
                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSubmit().then((e) => {
                                            if (e) {
                                                setTimeout(() => {
                                                    router.push("/admin/events/edit?meetNumber=" + form.meetNumber)
                                                }, 2000)
                                            }

                                        })
                                    }
                                    }
                                    disabled={!entries || !resultsValid || saving}
                                    className="rounded-full bg-[#2E6B3F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#255733] disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        router.back()
                                    }}
                                    disabled={saving}
                                    className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 text-sm font-semibold text-[#12301D] transition hover:bg-[#12301D]/5 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                            {success && (
                                <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                                    {success}
                                </div>
                            )}
                            {error && (
                                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </AuthGuard >
    );
}
