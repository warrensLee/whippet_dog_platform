"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DogForm from "@/app/components/DogForm";
import type { DogFormValues } from "@/lib/search/types";
import { emptyDogFormValues } from "@/lib/search/types";

/*
    Builds a clean payload from the current form state before sending
    the create request to the backend.

    This keeps trimming and formatting logic in one place instead of
    stuffing it all directly into the submit handler.
*/
function buildCreatePayload(form: DogFormValues): DogFormValues
{
    return {
        cwaNumber: form.cwaNumber.trim(),
        akcNumber: form.akcNumber.trim(),
        ckcNumber: form.ckcNumber.trim(),
        currentGrade: form.currentGrade.trim(),
        foreignNumber: form.foreignNumber.trim(),
        foreignType: form.foreignType.trim(),
        callName: form.callName.trim(),
        registeredName: form.registeredName.trim(),
        birthdate: form.birthdate,
        pedigreeLink: form.pedigreeLink.trim(),
        status: form.status.trim(),
        notes: form.notes.trim(),
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

export default function AddDogPage()
{
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
        () =>
        {
            let cancelled = false;

            async function checkAccess()
            {
                try
                {
                    const res = await fetch(
                        "/api/auth/me",
                        {
                            cache: "no-store",
                            credentials: "include",
                        }
                    );

                    const json = await res.json().catch(
                        () =>
                        {
                            return null;
                        }
                    );

                    if (!res.ok || !json?.signedIn || !json?.canManageDogs)
                    {
                        router.replace("/admin/login");
                        return;
                    }

                    if (!cancelled)
                    {
                        setAuthorized(true);
                    }
                }
                catch
                {
                    router.replace("/admin/login");
                }
                finally
                {
                    if (!cancelled)
                    {
                        setAuthLoading(false);
                    }
                }
            }

            checkAccess();

            return () =>
            {
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
    )
    {
        setForm(
            (prev) =>
            {
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
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>)
    {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try
        {
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
                () =>
                {
                    return null;
                }
            );

            if (!res.ok || !json?.ok)
            {
                throw new Error(json?.error || `Create failed (${res.status})`);
            }

            setSuccess("Dog created successfully.");

            router.push(`/admin/dogs/${encodeURIComponent(payload.cwaNumber)}/edit`);
        }
        catch (e)
        {
            setError(
                e instanceof Error
                    ? e.message
                    : "Failed to create dog."
            );
        }
        finally
        {
            setSaving(false);
        }
    }

    /*
        While auth is being checked, show a simple access gate.
    */
    if (authLoading)
    {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#1F4D2E] text-white">
                Checking access...
            </main>
        );
    }

    /*
        If the auth check is done and the user is not authorized,
        return nothing because the redirect is already happening.
    */
    if (!authorized)
    {
        return null;
    }

    return (
        <main className="pt-24 bg-[#1F4D2E]">
            {/* Hero / page heading section */}
            <section className="relative pt-16 pb-40 bg-gradient-to-b from-[#1F4D2E] to-[#18452A] overflow-hidden">
                {/* Decorative background layers */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-36 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -top-24 left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-[#2E6B3F]/25 blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center">
                    <div className="w-full max-w-3xl text-center">
                        {/* Back button */}
                        <div className="mb-4 flex items-center justify-center gap-3 text-sm text-white/75">
                            <Link
                                href="/admin/dogs"
                                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/15 transition"
                            >
                                ← Back to Admin Dogs
                            </Link>
                        </div>

                        {/* Page title */}
                        <h1 className="text-white text-5xl font-bold tracking-tight">
                            Add Dog
                        </h1>

                        <p className="mt-3 text-white/70">
                            Create a new dog record through the admin panel.
                        </p>

                        {/* Live page status text */}
                        <div className="mt-5 text-sm text-white/70">
                            {
                                error
                                    ? `Error: ${error}`
                                    : success
                                    ? success
                                    : "Enter the information for the new dog record."
                            }
                        </div>
                    </div>
                </div>

                {/* Bottom divider wave */}
                <svg
                    viewBox="0 0 1440 100"
                    preserveAspectRatio="none"
                    className="absolute left-0 -bottom-px w-full h-28"
                >
                    <path
                        d="M 0 0 L 144 19 L 288 36 L 432 51 L 576 64 L 720 75 L 864 84 L 1008 91 L 1152 96 L 1296 99 L 1440 100 L 1440 100 L 0 100 Z"
                        fill="#E7F0E9"
                    />
                </svg>
            </section>

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
                            () =>
                            {
                                router.push("/admin/dogs");
                            }
                        }
                        form={form}
                        setForm={setForm}
                        isEditMode={false}
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#DCE7DF] pb-2">
                <hr className="h-px bg-black/25 border-0 -mt-6 mb-4" />

                <p className="text-[#12301D] text-sm text-center leading-relaxed">
                    <span className="block">
                        Questions? Email{" "}
                        <a
                            href="mailto:cwawhippetracing@gmail.com"
                            className="underline hover:text-[#2E6B3F] transition"
                        >
                            cwawhippetracing@gmail.com
                        </a>
                    </span>

                    <span className="block mt-1">
                        © 2026 Continental Whippet Alliance. All rights reserved.
                    </span>
                </p>
            </footer>
        </main>
    );
}