"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DogForm from "@/app/components/dog/DogForm";
import type { DogFormValues } from "@/app/admin/dogs/types";
import { emptyDogFormValues } from "@/app/admin/dogs/types";
import HeroSection from "@/app/components/ui/HeroSection";
import AuthGuard from "@/lib/auth/authGuard";

/*
    Builds a clean payload from the current form state before sending
    the create request to the backend.

    This keeps trimming and formatting logic in one place instead of
    stuffing it all directly into the submit handler.
*/
function buildCreatePayload(form: DogFormValues): DogFormValues {
    return {
        cwaNumber: form.cwaNumber.trim(),
        currentGrade: form.currentGrade.trim(),
        registeredNumber: form.registeredNumber.trim(),
        foreignType: form.foreignType.trim(),
        callName: form.callName.trim(),
        registeredName: form.registeredName.trim(),
        birthdate: form.birthdate,
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
        kennelClubChampion: form.kennelClubChampion
    };
}

export default function AddDogPage() {
    const router = useRouter();

    /*
        Auth state protects the page from unauthorized users.
    */

    /*
        Form and submission state.
    */
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [form, setForm] = React.useState<DogFormValues>(emptyDogFormValues);

    /*
        Generic field updater passed down into the shared DogForm component.
    */
    function updateField<K extends keyof DogFormValues>
        (
            key: K,
            value: DogFormValues[K]
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
        setForm(emptyDogFormValues);
        setError("");
        setSuccess("");
    }

    /*
        Handles form submission and sends a create request to the backend.
        On success, the user is redirected to the edit page for the new dog.
    */
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = buildCreatePayload(form);

            const res = await fetch(
                "/api/dog/add",
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
                throw new Error(json?.error || `Create failed (${res.status})`);
            }

            setSuccess("Dog created successfully.");

            router.push(`/admin/dogs/edit/?id=${encodeURIComponent(payload.cwaNumber)}`);
        }
        catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Failed to create dog."
            );
        }
        finally {
            setSaving(false);
        }
    }

    /*
        While auth is being checked, show a simple access gate.
    */
    /*if (authLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#1F4D2E] text-white">
                Checking access...
            </main>
        );
    }*/

    /*
        If the auth check is done and the user is not authorized,
        return nothing because the redirect is already happening.
    */
    /*if (!authorized) {
        return null;
    }*/

    return (
        <AuthGuard>
            <main className="pt-24 bg-[#1F4D2E]">
                {/* 
                Hero section for the main search entry area.

                I kept this visually strong so the page feels more polished
                and less like a plain database dump.
            */}
                <HeroSection
                    title="Add Dog"
                    subtitle="Create a new dog record through the admin panel."
                    topContent={
                        <Link
                            href="/admin/dogs"
                            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            Back to Admin Dogs
                        </Link>
                    }
                >
                </HeroSection>


                {/* Main form section */}
                <section className="bg-[#E7F0E9] pt-12 pb-24">
                    <div className="max-w-5xl mx-auto px-4">
                        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-[#12301D]">
                                    New Dog Information
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
                                    disabled={saving}
                                    className="rounded-full border border-[#12301D]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#12301D] transition hover:bg-[#12301D]/5 disabled:opacity-50"
                                >
                                    Reset Changes
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.push("/admin/dogs")}
                                    disabled={saving}
                                    className="rounded-full border border-[#12301D]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#12301D] transition hover:bg-[#12301D]/5 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        <DogForm
                            values={form}
                            onChange={updateField}
                            onSubmit={handleSubmit}
                            saving={saving}
                            submitLabel="Create Dog"
                            error={error}
                            success={success}
                            onCancel={
                                () => {
                                    router.push("/admin/dogs");
                                }
                            }
                            form={form}
                            setForm={setForm}
                            isEditMode={false}
                        />
                    </div>
                </section>

            </main>
        </AuthGuard>
    );
}