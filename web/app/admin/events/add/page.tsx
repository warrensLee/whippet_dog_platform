// admin/events/add/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventForm from "@/app/components/event/EventForm";
import type { EventFormValues } from "@/app/admin/events/types";
import { emptyEventFormValues } from "@/app/admin/events/types";
import HeroSection from "@/app/components/ui/HeroSection";
import AuthGuard from "@/lib/auth/authGuard";

/*
    Builds a clean payload from the current form state before sending
    the create request to the backend.

    This keeps trimming and formatting logic in one place instead of
    stuffing it all directly into the submit handler.
*/
function buildCreatePayload(form: EventFormValues): Record<string, unknown> {
    return {
        meetNumber: form.meetNumber.trim(),
        clubAbbreviation: form.clubAbbreviation.trim(),
        meetDate: form.meetDate,
        raceSecretary: form.raceSecretary?.personId || "",
        judge: form.judge?.personId || "",
        location: form.location.trim(),
        yards: form.yards.trim(),
        publicNotes: form.publicNotes.trim(),
        privateNotes: form.privateNotes.trim(),
    };
}

export default function AddEventPage() {
    const router = useRouter();

    /*
        Form and submission state.
    */
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [form, setForm] = React.useState(emptyEventFormValues);

    const [isAdmin, setIsAdmin] = React.useState(false);
    const [authLoading, setAuthLoading] = React.useState(true);

    React.useEffect(() => {
        async function checkAdmin() {
            try {
                const res = await fetch("/api/auth/me", {
                    credentials: "include",
                });

                const json = await res.json().catch(() => null);

                const role = (json?.user?.SystemRole || "").toUpperCase();

                setIsAdmin(role === "ADMIN");
            } catch {
                setIsAdmin(false);
            } finally {
                setAuthLoading(false); // ✅ ADD THIS
            }
        }

        checkAdmin();
    }, []);


    function updateField<K extends keyof EventFormValues>(
        key: K,
        value: EventFormValues[K]
    ) {
        setForm((prev) => {
            return {
                ...prev,
                [key]: value,
            };
        });
    }


    function handleResetForm() {
        setForm(emptyEventFormValues);
        setError("");
        setSuccess("");
    }

    /*
        Handles form submission and sends a create request to the backend.
        On success, the user is redirected to the edit page for the new Event.
    */
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = buildCreatePayload(form);

            const res = await fetch(
                "/api/meet/add",
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

            setSuccess("Event created successfully.");

            router.push(`/admin/events/edit?meetNumber=${encodeURIComponent(payload.meetNumber as string)}`);
        }
        catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Failed to create event."
            );
        }
        finally {
            setSaving(false);
        }
    }

    return (
        <AuthGuard>
            <main className="pt-24 bg-[#1F4D2E]">
                {/* 
                Hero section for the main search entry area.

                I kept this visually strong so the page feels more polished
                and less like a plain database dump.
            */}
                <HeroSection
                    title="Add Event"
                    subtitle="Create a new event record through the admin panel."
                    topContent={
                        <Link
                            href="/admin/events"
                            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            Back to Admin Events
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
                                    New Event Information
                                </h2>
                                <div className="mt-1 h-1 w-14 rounded-full bg-[#2E6B3F]/70" />
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
                                    onClick={() => router.push("/admin/events")}
                                    disabled={saving}
                                    className="rounded-full border border-[#12301D]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#12301D] transition hover:bg-[#12301D]/5 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        <EventForm
                            values={form}
                            onChange={updateField}
                            onSubmit={handleSubmit}
                            saving={saving}
                            personLoading={authLoading}
                            submitLabel="Create Event"
                            error={error}
                            success={success}
                            onCancel={
                                () => {
                                    router.push("/admin/events");
                                }
                            }
                            isEditMode={false}
                            canEditPrivateNotes={isAdmin}
                        />
                    </div>
                </section>

            </main>
        </AuthGuard>
    );
}