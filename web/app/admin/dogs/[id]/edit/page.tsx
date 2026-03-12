// [id]/edit/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DogForm from "@/app/components/DogForm";
import type { DogFormValues } from "@/lib/search/types";
import { emptyDogFormValues } from "@/lib/search/types";

/*
    Safely converts incoming unknown values to strings.

    This helps normalize API data before putting it into form state.
    If the backend gives us null/undefined, we fall back to an empty string.
*/
function normalizeText(x: unknown): string
{
    if (typeof x === "string")
    {
        return x;
    }

    if (typeof x === "number")
    {
        return String(x);
    }

    return "";
}

type RawDogGetResponse =
{
    ok: boolean;
    data?:
    {
        cwaNumber?: string;
        akcNumber?: string | null;
        ckcNumber?: string | null;
        currentGrade?: string | null;
        foreignNumber?: string | null;
        foreignType?: string | null;
        callName?: string | null;
        registeredName?: string | null;
        birthdate?: string | null;
        pedigreeLink?: string | null;
        status?: string | null;
        notes?: string | null;
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
function buildFormFromDog(data: NonNullable<RawDogGetResponse["data"]>): DogFormValues
{
    return {
        cwaNumber: normalizeText(data.cwaNumber),
        akcNumber: normalizeText(data.akcNumber),
        ckcNumber: normalizeText(data.ckcNumber),
        currentGrade: normalizeText(data.currentGrade),
        foreignNumber: normalizeText(data.foreignNumber),
        foreignType: normalizeText(data.foreignType),
        callName: normalizeText(data.callName),
        registeredName: normalizeText(data.registeredName),
        birthdate: normalizeText(data.birthdate),
        pedigreeLink: normalizeText(data.pedigreeLink),
        status: normalizeText(data.status) || "Active",
        notes: normalizeText(data.notes),
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

    This keeps trimming logic in one place instead of stuffing it
    directly into the submit handler like a junk drawer.
*/
function buildEditPayload(form: DogFormValues): DogFormValues
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
        birthdate: normalizeText(form.birthdate).slice(0, 10),
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

export default function EditDogPage()
{
    const params = useParams();
    const router = useRouter();

    const id = String(params?.id ?? "");

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

    /*
        Checks whether the current user is signed in and allowed
        to manage dog records.
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
        After authorization succeeds, load the dog record that matches
        the route id and populate the edit form.
    */
    React.useEffect(
        () =>
        {
            if (!authorized)
            {
                return;
            }

            let cancelled = false;

            async function loadDog()
            {
                setLoading(true);
                setError("");
                setSuccess("");

                try
                {
                    const res = await fetch(
                        `/api/dog/get/${encodeURIComponent(id)}`,
                        {
                            method: "GET",
                            cache: "no-store",
                            credentials: "include",
                        }
                    );

                    const json = (await res.json().catch(
                        () =>
                        {
                            return null;
                        }
                    )) as RawDogGetResponse | null;

                    if (!res.ok || !json?.ok || !json.data)
                    {
                        throw new Error(json?.error || "Failed to load dog.");
                    }

                    if (cancelled)
                    {
                        return;
                    }

                    setForm(buildFormFromDog(json.data));
                }
                catch (e)
                {
                    if (!cancelled)
                    {
                        setError(
                            e instanceof Error
                                ? e.message
                                : "Failed to load dog."
                        );
                    }
                }
                finally
                {
                    if (!cancelled)
                    {
                        setLoading(false);
                    }
                }
            }

            loadDog();

            return () =>
            {
                cancelled = true;
            };
        },
        [authorized, id]
    );

    /*
        Generic form field updater passed down into DogForm.
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
        Handles form submission and sends the cleaned payload
        to the edit API route.
    */
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>)
    {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try
        {
            const payload = buildEditPayload(form);

            const res = await fetch(
                "/api/dog/edit",
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
                throw new Error(json?.error || `Save failed (${res.status})`);
            }

            setSuccess("Dog information updated successfully.");
        }
        catch (e)
        {
            setError(
                e instanceof Error
                    ? e.message
                    : "Failed to save changes."
            );
        }
        finally
        {
            setSaving(false);
        }
    }

    /*
        While auth is still being checked, show a simple gate screen.
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
        If auth check finished but user is not authorized, we return null
        because the redirect is already being handled.
    */
    if (!authorized)
    {
        return null;
    }

    return (
        <main className="pt-24 bg-[#1F4D2E]">
            {/* Hero / page heading section */}
            <section className="relative pt-16 pb-40 bg-gradient-to-b from-[#1F4D2E] to-[#18452A] overflow-hidden">
                {/* Background glow / overlay decoration */}
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
                            Edit Dog
                        </h1>

                        <p className="mt-3 text-white/70">
                            Update dog information securely through the admin panel.
                        </p>

                        {/* Live page status text */}
                        <div className="mt-5 text-sm text-white/70">
                            {
                                loading
                                    ? "Loading dog information..."
                                    : error
                                    ? `Error: ${error}`
                                    : success
                                    ? success
                                    : `Editing record #${id}`
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
                            Dog Information
                        </h2>

                        <div className="mt-1 h-1 w-14 rounded-full bg-[#2E6B3F]/70" />
                    </div>

                    <DogForm
                        values={form}
                        onChange={updateField}
                        onSubmit={handleSubmit}
                        saving={saving || loading}
                        submitLabel="Save Changes"
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
                        isEditMode={true}
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