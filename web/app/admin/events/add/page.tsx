// admin/events/add/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventForm from "@/app/components/EventForm";
import type { EventFormValues } from "@/app/admin/events/types";
import { emptyEventFormValues } from "@/app/admin/events/types";
import HeroSection from "@/app/components/HeroSection";
import AuthGuard from "@/lib/auth/authGuard";

/*
    Builds a clean payload from the current form state before sending
    the create request to the backend.

    This keeps trimming and formatting logic in one place instead of
    stuffing it all directly into the submit handler.
*/
function buildCreatePayload(form: EventFormValues): EventFormValues {
    return {
        meetNumber: form.meetNumber.trim(),
        clubAbbreviation: form.clubAbbreviation.trim(),
        meetDate: form.meetDate,
        raceSecretary: form.raceSecretary.trim(),
        judge: form.judge.trim(),
        location: form.location.trim(),
        yards: form.yards.trim(),

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

    const [form, setForm] = React.useState<EventFormValues>(emptyEventFormValues);

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

            router.push(`/admin/events/${encodeURIComponent(payload.meetNumber)}/edit`);
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
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#12301D]">
                                New Event Information
                            </h2>

                            <div className="mt-1 h-1 w-14 rounded-full bg-[#2E6B3F]/70" />
                        </div>

                        <EventForm
                            values={form}
                            onChange={updateField}
                            onSubmit={handleSubmit}
                            saving={saving}
                            submitLabel="Create Event"
                            error={error}
                            success={success}
                            onCancel={
                                () => {
                                    router.push("/admin/events");
                                }
                            }
                            isEditMode={false}
                        />
                    </div>
                </section>

            </main>
        </AuthGuard>
    );
}