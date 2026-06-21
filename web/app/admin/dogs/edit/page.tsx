"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DogForm from "../DogForm";
import type { DogFormValues } from "@/app/admin/dogs/types";
import { emptyDogFormValues } from "@/app/admin/dogs/types";
import HeroSection from "@/app/components/ui/HeroSection";
import DogOwnersSection from "./DogOwnersSection";
import DogTitlesSection from "@/app/components/dog/DogTitlesSection";
import AuthGuard from "@/lib/auth/authGuard";

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

    Appends "T00:00:00" so that new Date() interprets it as local
    midnight (avoids the UTC→local date-shift bug).
*/
function normalizeDateInput(value: unknown): string {
    const text = normalizeText(value).trim();

    if (!text) {
        return "";
    }

    return text.slice(0, 10);
}

/*
    Converts a YYYY-MM-DD string to a timezone-safe YYYY-MM-DD value
    suitable for <input type="date">.

    Without this, new Date("YYYY-MM-DD") is parsed as UTC midnight,
    which shifts the local date by one day for users in negative-UTC
    timezones.
*/
function normalizeDate(value: unknown): string {
    const text = normalizeText(value).trim();

    if (!text) {
        return "";
    }

    const parts = text.slice(0, 10).split("-");
    if (parts.length !== 3) {
        return text.slice(0, 10);
    }

    const [yearStr, monthStr, dayStr] = parts;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return text.slice(0, 10);
    }

    const localDate = new Date(year, month - 1, day);
    if (isNaN(localDate.getTime())) {
        return text.slice(0, 10);
    }

    const y = localDate.getFullYear();
    const m = String(localDate.getMonth() + 1).padStart(2, "0");
    const d = String(localDate.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
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
        kennelClubChampion: boolean;
        meetPoints?: string | null;
        arxPoints?: string | null;
        narxPoints?: string | null;
        showPoints?: string | null;
        dpcPoints?: string | null;
        dpcLegs?: string | null;
        manualMeetPointsAdjustment?: string | null;
        manualArxPointsAdjustment?: string | null;
        manualNarxPointsAdjustment?: string | null;
        manualShowPointsAdjustment?: string | null;
        manualDpcPointsAdjustment?: string | null;
        manualMeetAppearancesAdjustment?: string | null;
        manualMeetWinsAdjustment?: string | null;
        manualDPCLegsAdjustment?: string | null;
        manualHighCombinedWinsAdjustment?: string | null;
        meetWins?: string | null;
        meetAppearences?: string | null;
        highCombinedWins?: string | null;
        adjustedArxPoints?: string | null;
        adjustedDPCLegs?: string | null;
        adjustedDpcPoints?: string | null;
        adjustedHighCombinedWins?: string | null;
        adjustedMeetAppearances?: string | null;
        adjustedMeetPoints?: string | null;
        adjustedMeetWins?: string | null;
        adjustedNarxPoints?: string | null;
        adjustedShowPoints?: string | null;
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
        birthdate: normalizeDate(data.birthdate),
        pedigreeLink: normalizeText(data.pedigreeLink),
        status: normalizeText(data.status) || "Active",
        publicNotes: normalizeText(data.publicNotes),
        privateNotes: normalizeText(data.privateNotes),
        dna: normalizeText(data.dna),
        sireDna: normalizeText(data.sireDna),
        damDna: normalizeText(data.damDna),
        meetPoints: normalizeText(data.adjustedMeetPoints),
        arxPoints: normalizeText(data.adjustedArxPoints),
        narxPoints: normalizeText(data.adjustedNarxPoints),
        showPoints: normalizeText(data.adjustedShowPoints),
        dpcPoints: normalizeText(data.dpcPoints),
        dpcLegs: normalizeText(data.adjustedDPCLegs),
        manualMeetPointsAdjustment: normalizeText(data.meetPoints),
        manualArxPointsAdjustment: normalizeText(data.arxPoints),
        manualNarxPointsAdjustment: normalizeText(data.narxPoints),
        manualShowPointsAdjustment: normalizeText(data.showPoints),
        manualDpcPointsAdjustment: normalizeText(data.dpcPoints),
        manualMeetAppearancesAdjustment: normalizeText(data.meetAppearences),
        manualMeetWinsAdjustment: normalizeText(data.meetWins),
        manualDPCLegsAdjustment: normalizeText(data.dpcLegs),
        manualHighCombinedWinsAdjustment: normalizeText(data.highCombinedWins),
        kennelClubChampion: data.kennelClubChampion,
        meetWins: normalizeText(data.adjustedMeetWins),
        meetAppearences: normalizeText(data.adjustedMeetAppearances),
        highCombinedWins: normalizeText(data.adjustedHighCombinedWins),
    };
}

/*
    Cleans form state and computes manual adjustments before
    sending the update payload to the backend.

    Adjustments are calculated as the difference between the
    current form value and the original database value.
*/
function buildEditPayload(form: DogFormValues): DogFormValues {
    function num(v: string): number {
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }

    function adj(current: string, original: string): string {
        return String(num(current) - num(original));
    }

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
        meetPoints: form.manualMeetPointsAdjustment.trim(),
        arxPoints: form.manualArxPointsAdjustment.trim(),
        narxPoints: form.manualNarxPointsAdjustment.trim(),
        showPoints: form.manualShowPointsAdjustment.trim(),
        dpcPoints: form.manualDpcPointsAdjustment.trim(),
        dpcLegs: form.manualDPCLegsAdjustment.trim(),
        manualMeetPointsAdjustment: adj(form.meetPoints, form.manualMeetPointsAdjustment),
        manualArxPointsAdjustment: adj(form.arxPoints, form.manualArxPointsAdjustment),
        manualNarxPointsAdjustment: adj(form.narxPoints, form.manualNarxPointsAdjustment),
        manualShowPointsAdjustment: adj(form.showPoints, form.manualShowPointsAdjustment),
        manualDpcPointsAdjustment: adj(form.dpcPoints, form.manualDpcPointsAdjustment),
        manualMeetAppearancesAdjustment: adj(form.meetAppearences, form.manualMeetAppearancesAdjustment),
        manualMeetWinsAdjustment: adj(form.meetWins, form.manualMeetWinsAdjustment),
        manualDPCLegsAdjustment: adj(form.dpcLegs, form.manualDPCLegsAdjustment),
        manualHighCombinedWinsAdjustment: adj(form.highCombinedWins, form.manualHighCombinedWinsAdjustment),
        kennelClubChampion: form.kennelClubChampion,
        meetWins: form.manualMeetWinsAdjustment.trim(),
        meetAppearences: form.manualMeetAppearancesAdjustment.trim(),
        highCombinedWins: form.manualHighCombinedWinsAdjustment.trim(),
    };
}

function buildPublicDogHref(cwaNumber: string, fallbackId: string): string {
    const dogId = (cwaNumber || fallbackId).trim();

    return `/dog?id=${encodeURIComponent(dogId)}`;
}

export default function Page() {
    return (<React.Suspense><EditDogPage /></React.Suspense>)
}

function EditDogPage() {
    const params = useSearchParams();
    const router = useRouter();

    const id = String(params.get("id") ?? "").trim();


    /*
        Page/form state.
    */
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [form, setForm] = React.useState<DogFormValues>(emptyDogFormValues);

    /*
        After authorization succeeds, load the dog record that matches
        the route id and populate the edit form.
    */
    React.useEffect(() => {

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
    }, [id]);

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


    /*
        If auth check finished but user is not authorized, we return null
        because the redirect is already being handled.
    */

    const publicDogHref = buildPublicDogHref(form.cwaNumber, id);
    const displayName = form.registeredName || form.callName || id || "Unknown Dog";

    return (
        <AuthGuard>
            <main className="bg-[#1F4D2E] pt-24">
                <HeroSection
                    title="Edit Dog"
                    subtitle="Update dog information securely through the admin panel."
                    topContent={
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            <Link
                                href="/admin/dogs"
                                className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                            >
                                Back to Admin Dogs
                            </Link>


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

                                <p className="mt-2 text-sm font-medium text-[#12301D]/70">
                                    <span className="font-bold text-red-600">*</span> Required field
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
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
                                error={error}
                                success={success}
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
                        {/* Action buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
                            <button
                                type="submit"
                                form="dog-form"
                                disabled={saving}
                                className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </AuthGuard>
    );
}
