"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DogForm from "@/app/components/DogForm";
import type { DogFormValues } from "@/app/admin/dogs/types";
import { emptyDogFormValues } from "@/app/admin/dogs/types";
import HeroSection from "@/app/components/HeroSection";
import DogOwnersSection from "@/app/components/DogOwnersSection";
import DogTitlesSection from "@/app/components/DogTitlesSection";

/*
    Safely converts incoming unknown values to strings.

    This keeps API data predictable before it enters form state.
*/
function normalizeText(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "number") {
        return String(value);
    }

    return "";
}

/*
    Normalizes a date-like value into YYYY-MM-DD for form usage.
*/
function normalizeDateInput(value: unknown): string {
    const text = normalizeText(value).trim();

    if (!text) {
        return "";
    }

    return text.slice(0, 10);
}

type RawDogGetResponse = {
    ok: boolean;
    data?: {
        cwaNumber?: string;
        currentGrade?: string | null;
        registeredNumber?: string | null;
        foreignType?: string | null;
        callName?: string | null;
        registeredName?: string | null;
        birthdate?: string | null;
        pedigreeLink?: string | null;
        status?: string | null;
        publicNotes?: string | null;
        privateNotes?: string | null;
        dna?: string | null;
        sireDna?: string | null;
        damDna?: string | null;
        meetPoints?: string | null;
        arxPoints?: string | null;
        narxPoints?: string | null;
        showPoints?: string | null;
        dpcLegs?: string | null;
        meetWins?: string | null;
        meetAppearences?: string | null;
        highCombinedWins?: string | null;
    };
    error?: string;
};

/*
    Converts backend dog data into the exact DogFormValues shape
    expected by the shared DogForm component.
*/
function buildFormFromDog(data: NonNullable<RawDogGetResponse["data"]>): DogFormValues {
    return {
        cwaNumber: normalizeText(data.cwaNumber),
        currentGrade: normalizeText(data.currentGrade),
        registeredNumber: normalizeText(data.registeredNumber),
        foreignType: normalizeText(data.foreignType),
        callName: normalizeText(data.callName),
        registeredName: normalizeText(data.registeredName),
        birthdate: normalizeDateInput(data.birthdate),
        pedigreeLink: normalizeText(data.pedigreeLink),
        status: normalizeText(data.status) || "Active",
        publicNotes: normalizeText(data.publicNotes),
        privateNotes: normalizeText(data.privateNotes),
        dna: normalizeText(data.dna),
        sireDna: normalizeText(data.sireDna),
        damDna: normalizeText(data.damDna),
        meetPoints: normalizeText(data.meetPoints),
        arxPoints: normalizeText(data.arxPoints),
        narxPoints: normalizeText(data.narxPoints),
        showPoints: normalizeText(data.showPoints),
        dpcLegs: normalizeText(data.dpcLegs),
        meetWins: normalizeText(data.meetWins),
        meetAppearences: normalizeText(data.meetAppearences),
        highCombinedWins: normalizeText(data.highCombinedWins),
    };
}

/*
    Cleans form state before sending it to the backend.
*/
function buildEditPayload(form: DogFormValues): DogFormValues {
    return {
        cwaNumber: form.cwaNumber.trim(),
        currentGrade: form.currentGrade.trim(),
        registeredNumber: form.registeredNumber.trim(),
        foreignType: form.foreignType.trim(),
        callName: form.callName.trim(),
        registeredName: form.registeredName.trim(),
        birthdate: normalizeDateInput(form.birthdate),
        pedigreeLink: form.pedigreeLink.trim(),
        status: form.status.trim(),
        publicNotes: form.publicNotes.trim(),
        privateNotes: form.privateNotes.trim(),
        dna: form.dna.trim(),
        sireDna: form.sireDna.trim(),
        damDna: form.damDna.trim(),
        meetPoints: form.meetPoints.trim(),
        arxPoints: form.arxPoints.trim(),
        narxPoints: form.narxPoints.trim(),
        showPoints: form.showPoints.trim(),
        dpcLegs: form.dpcLegs.trim(),
        meetWins: form.meetWins.trim(),
        meetAppearences: form.meetAppearences.trim(),
        highCombinedWins: form.highCombinedWins.trim(),
    };
}

function buildPublicDogHref(cwaNumber: string, fallbackId: string): string {
    const dogId = (cwaNumber || fallbackId).trim();

    return `/dog/${encodeURIComponent(dogId)}`;
}

export default function Page() {
    return (<React.Suspense><EditDogPage /></React.Suspense>)
}

function EditDogPage() {
    const params = useSearchParams();
    const router = useRouter();

    const id = String(params.get("id") ?? "").trim();

    /*
        Auth/loading state for protecting the page.
    */
    const [authLoading, setAuthLoading] = React.useState(true);
    const [authorized, setAuthorized] = React.useState(false);

    /*
        Page/form state.
    */
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [form, setForm] = React.useState<DogFormValues>(emptyDogFormValues);
    const [initialForm, setInitialForm] = React.useState<DogFormValues>(emptyDogFormValues);

    /*
        Checks whether the current user is signed in and allowed
        to manage dog records.
    */
    React.useEffect(() => {
        let cancelled = false;

        async function checkAccess() {
            try {
                const res = await fetch("/api/auth/me", {
                    cache: "no-store",
                    credentials: "include",
                });

                const json = await res.json().catch(() => null);

                if (!res.ok || !json?.signedIn || !json?.canManageDogs) {
                    router.replace("/login");
                    return;
                }

                if (!cancelled) {
                    setAuthorized(true);
                }
            } catch {
                router.replace("/login");
            } finally {
                if (!cancelled) {
                    setAuthLoading(false);
                }
            }
        }

        checkAccess();

        return () => {
            cancelled = true;
        };
    }, [router]);

    /*
        After authorization succeeds, load the dog record that matches
        the route id and populate the edit form.
    */
    React.useEffect(() => {
        if (!authorized) {
            return;
        }

        if (!id) {
            setError("Invalid dog ID.");
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function loadDog() {
            setLoading(true);
            setError("");
            setSuccess("");

            try {
                const res = await fetch(`/api/dog/get/${encodeURIComponent(id)}`, {
                    method: "GET",
                    cache: "no-store",
                    credentials: "include",
                });

                const json = (await res.json().catch(() => null)) as RawDogGetResponse | null;

                if (!res.ok || !json?.ok || !json.data) {
                    throw new Error(json?.error || "Failed to load dog.");
                }

                if (cancelled) {
                    return;
                }

                const nextForm = buildFormFromDog(json.data);

                setForm(nextForm);
                setInitialForm(nextForm);
            } catch (e) {
                if (!cancelled) {
                    setError(
                        e instanceof Error
                            ? e.message
                            : "Failed to load dog."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadDog();

        return () => {
            cancelled = true;
        };
    }, [authorized, id]);

    /*
        Generic form field updater passed down into DogForm.
    */
    function updateField<K extends keyof DogFormValues>(key: K, value: DogFormValues[K]) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));

        if (success) {
            setSuccess("");
        }
    }

    function handleResetForm() {
        setForm(initialForm);
        setError("");
        setSuccess("");
    }

    /*
        Handles form submission and sends the cleaned payload
        to the edit API route.
    */
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = buildEditPayload(form);

            const res = await fetch("/api/dog/edit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.ok) {
                throw new Error(json?.error || `Save failed (${res.status})`);
            }

            const cleanedForm = buildEditPayload(form);

            setForm(cleanedForm);
            setInitialForm(cleanedForm);
            setSuccess("Dog information updated successfully.");
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Failed to save changes."
            );
        } finally {
            setSaving(false);
        }
    }

    /*
        While auth is still being checked, show a simple gate screen.
    */
    if (authLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#1F4D2E] text-white">
                Checking access...
            </main>
        );
    }

    /*
        If auth check finished but user is not authorized, we return null
        because the redirect is already being handled.
    */
    if (!authorized) {
        return null;
    }

    const publicDogHref = buildPublicDogHref(form.cwaNumber, id);
    const displayName = form.registeredName || form.callName || id || "Unknown Dog";

    return (
        <main className="bg-[#1F4D2E] pt-24">
            <HeroSection
                title="Edit Dog"
                subtitle="Update dog information securely through the admin panel."
                topContent={
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            Back
                        </button>

                        <Link
                            href={publicDogHref}
                            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            View Dog Page
                        </Link>
                    </div>
                }
            >
                <div className="-mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/80">
                    <span>
                        Editing record:{" "}
                        <span className="font-semibold text-white">{displayName}</span>
                    </span>

                    {form.cwaNumber ? (
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            CWA #{form.cwaNumber}
                        </span>
                    ) : null}

                    {form.status ? (
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            {form.status}
                        </span>
                    ) : null}
                </div>
            </HeroSection>

            <section className="bg-[#E7F0E9] pb-24 pt-12">
                <div className="mx-auto max-w-5xl px-4 space-y-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-[#12301D]">
                                Dog Information
                            </h2>
                            <div className="mt-1 h-1 w-14 rounded-full bg-[#2E6B3F]/70" />
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
                                onClick={() => router.back()}
                                disabled={saving}
                                className="rounded-full border border-[#12301D]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#12301D] transition hover:bg-[#12301D]/5 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="rounded-2xl border border-black/10 bg-white/90 p-6 shadow-sm">
                            <p className="text-sm text-[#12301D]/60">Loading dog record...</p>
                        </div>
                    ) : error && !form.cwaNumber ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                            <p className="text-sm font-medium text-red-700">{error}</p>

                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    ) : (
                        <DogForm
                            values={form}
                            onChange={updateField}
                            onSubmit={handleSubmit}
                            saving={saving}
                            submitLabel={saving ? "Saving..." : "Save Changes"}
                            error={error}
                            success={success}
                            onCancel={() => {
                                router.back();
                            }}
                            form={form}
                            setForm={setForm}
                            isEditMode={true}
                        />
                    )}

                    {!loading && form.cwaNumber && (
                        <>
                            <DogOwnersSection cwaNumber={form.cwaNumber} />
                            <DogTitlesSection cwaNumber={form.cwaNumber} />
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}