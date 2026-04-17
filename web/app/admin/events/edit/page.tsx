// admin/events/edit?meetNumber=

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import EventForm from "@/app/components/event/EventForm";
import type { EventFormValues } from "@/app/admin/events/types";
import { emptyEventFormValues } from "@/app/admin/events/types";
import HeroSection from "@/app/components/ui/HeroSection";

/*
    Safely converts incoming unknown values to strings.

    This helps normalize API data before putting it into form state.
    If the backend gives us null/undefined, we fall back to an empty string.
*/
function normalizeText(x: unknown): string {
    if (typeof x === "string") {
        return x;
    }

    if (typeof x === "number") {
        return String(x);
    }

    return "";
}

/*
    Converts dates to the correct format,
    ensuring that it is in form: YYYY-MM-DD
*/
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

type RawEventGetResponse =
    {
        ok: boolean;
        data?:
        {
            meetNumber?: string;
            clubAbbreviation?: string | null;
            meetDate?: string;
            raceSecretary?: string | null;
            judge?: string | null;
            location?: string | null;
            yards?: string | null;
            publicNotes?: string | null;
            privateNotes?: string | null;
        };
        error?: string;
    };

/*
    Converts backend Event data into the exact EventFormValues shape
    expected by the shared EventForm component.
*/
function buildFormFromEvent(data: NonNullable<RawEventGetResponse["data"]>): EventFormValues {
    return {
        meetNumber: normalizeText(data.meetNumber),
        clubAbbreviation: normalizeText(data.clubAbbreviation),
        meetDate: toDateInputValue(data.meetDate),
        raceSecretary: normalizeText(data.raceSecretary),
        judge: normalizeText(data.judge),
        location: normalizeText(data.location),
        yards: normalizeText(data.yards),
        publicNotes: normalizeText(data.publicNotes),
        privateNotes: normalizeText(data.privateNotes),
    };
}

/*
    Cleans form state before sending it to the backend.

    This keeps trimming logic in one place instead of stuffing it
    directly into the submit handler like a junk drawer.
*/
function buildEditPayload(form: EventFormValues): EventFormValues {
    return {
        meetNumber: form.meetNumber.trim(),
        clubAbbreviation: form.clubAbbreviation.trim(),
        meetDate: form.meetDate ? `${form.meetDate}T00:00:00` : "",
        raceSecretary: form.raceSecretary.trim(),
        judge: form.judge.trim(),
        location: form.location.trim(),
        yards: form.yards.trim(),
        publicNotes: form.publicNotes.trim(),
        privateNotes: form.privateNotes.trim(),
    };
}

export default function Page() {
    return (<React.Suspense><EditEventPage /></React.Suspense>)
}
function EditEventPage() {
    const params = useSearchParams();
    const router = useRouter();

    const meetNumber = String(params.get("meetNumber") ?? "").trim();
    /*
        Auth/loading state for protecting the page.
    */
    const [authLoading, setAuthLoading] = React.useState(true);
    const [authorized, setAuthorized] = React.useState(false);
    const [isAdmin, setIsAdmin] = React.useState(false);


    /*
        Page/form state.
    */
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [form, setForm] = React.useState<EventFormValues>(emptyEventFormValues);
    const [initialForm, setInitialForm] = React.useState<EventFormValues>(emptyEventFormValues);


    /*
        Checks whether the current user is signed in and allowed
        to manage Event records.
    */

    React.useEffect(() => {
        let cancelled = false;

        async function checkAccess() {
            try {
                const res = await fetch("/api/auth/me", {
                    credentials: "include",
                });

                const json = await res.json().catch(() => null);

                if (!res.ok || !json?.signedIn) {
                    router.replace("/login");
                    return;
                }

                const role = (json?.user?.SystemRole || "").toUpperCase();

                if (!cancelled) {
                    setAuthorized(true);
                    setIsAdmin(role === "ADMIN");
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
        After authorization succeeds, load the Event record that matches
        the route id and populate the edit form.
    */
    React.useEffect(
        () => {
            if (!authorized) {
                return;
            }

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

                    const nextForm = buildFormFromEvent(json.data);
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
        [authorized, meetNumber]
    );

    /*
        Generic form field updater passed down into EventForm.
    */
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

            const res = await fetch(
                "/api/meet/edit",
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
                raceSecretary: form.raceSecretary.trim(),
                judge: form.judge.trim(),
                location: form.location.trim(),
                yards: form.yards.trim(),
                publicNotes: form.publicNotes.trim(),
                privateNotes: form.privateNotes.trim(),
            };

            setForm(cleanedForm);
            setInitialForm(cleanedForm);
            setSuccess("Event information updated successfully.");
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

    return (
        <main className="pt-24 bg-[#1F4D2E]">
            {/* 
                Hero section for the main search entry area.

                I kept this visually strong so the page feels more polished
                and less like a plain database dump.
            */}
            <HeroSection
                title="Edit Event"
                subtitle="Update Event information securely through the admin panel."
                topContent={
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/admin/events"
                            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            Back to Admin Events
                        </Link>

                        <Link
                            href={`/event?id=${encodeURIComponent(form.meetNumber || meetNumber)}`}
                            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            View Event Page
                        </Link>
                    </div>
                }
            >

                <div className="-mt-6 text-white/80 text-sm">
                    Editing record: <span className="font-semibold text-white">{form.meetNumber || meetNumber}</span>
                </div>


            </HeroSection>

            {/* Main form section */}
            <section className="bg-[#E7F0E9] pt-12 pb-24">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-[#12301D]">
                                Event Information
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
                        saving={saving || loading}
                        submitLabel="Save Changes"
                        error={error}
                        success={success}
                        onCancel={
                            () => {
                                router.push("/admin/events");
                            }
                        }
                        isEditMode={true}
                        canEditPrivateNotes={isAdmin}
                    />
                </div>
            </section>
        </main>
    );
}