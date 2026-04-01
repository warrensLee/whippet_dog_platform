"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DogForm from "@/app/components/DogForm";
import type { DogFormValues } from "@/app/admin/dogs/types";
import { emptyDogFormValues } from "@/app/admin/dogs/types";
import HeroSection from "@/app/components/HeroSection";
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
    };
}

export default function AddDogPage() {
    const router = useRouter();

    /*
        Auth state protects the page from unauthorized users.
    */
    const [authLoading, setAuthLoading] = React.useState(true);
    const [authorized, setAuthorized] = React.useState(false);

    /*
        Form and submission state.
    */
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [form, setForm] = React.useState<DogFormValues>(emptyDogFormValues);

    /*
        Check whether the current user is allowed to manage dog records.
        If not, redirect them to the admin login page.
    */
    React.useEffect(
        () => {
            let cancelled = false;

            async function checkAccess() {
                try {
                    const res = await fetch(
                        "/api/auth/me",
                        {
                            cache: "no-store",
                            credentials: "include",
                        }
                    );

                    const json = await res.json().catch(
                        () => {
                            return null;
                        }
                    );

                    if (!res.ok || !json?.signedIn || !json?.canManageDogs) {
                        //router.replace("/login");
                        return;
                    }

                    if (!cancelled) {
                        setAuthorized(true);
                    }
                }
                catch {
                    //router.replace("/login");
                }
                finally {
                    if (!cancelled) {
                        setAuthLoading(false);
                    }
                }
            }

            checkAccess();

            return () => {
                cancelled = true;
            };
        },
        [router]
    );

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

            router.push(`/admin/dogs/${encodeURIComponent(payload.cwaNumber)}/edit`);
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
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#12301D]">
                                New Dog Information
                            </h2>

                            <div className="mt-1 h-1 w-14 rounded-full bg-[#2E6B3F]/70" />
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