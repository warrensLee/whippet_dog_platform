"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DogForm from "@/app/components/DogForm";
import type { DogFormValues } from "@/lib/search/types";
import { emptyDogFormValues } from "@/lib/search/types";

function normalizeText(x: unknown): string {
  return typeof x === "string" ? x : "";
}

type RawDogGetResponse = {
  ok: boolean;
  data?: {
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

export default function EditDogPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params?.id ?? "");

  const [authLoading, setAuthLoading] = React.useState(true);
  const [authorized, setAuthorized] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [form, setForm] = React.useState<DogFormValues>(emptyDogFormValues);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.signedIn || !json?.canManageDogs) {
          router.replace("/admin/login");
          return;
        }

        if (!cancelled) setAuthorized(true);
      } catch {
        router.replace("/admin/login");
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  React.useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    (async () => {
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

        if (cancelled) return;

        setForm({
          cwaNumber: normalizeText(json.data.cwaNumber),
          akcNumber: normalizeText(json.data.akcNumber),
          ckcNumber: normalizeText(json.data.ckcNumber),
          currentGrade: normalizeText(json.data.currentGrade),
          foreignNumber: normalizeText(json.data.foreignNumber),
          foreignType: normalizeText(json.data.foreignType),
          callName: normalizeText(json.data.callName),
          registeredName: normalizeText(json.data.registeredName),
          birthdate: normalizeText(json.data.birthdate),
          pedigreeLink: normalizeText(json.data.pedigreeLink),
          status: normalizeText(json.data.status) || "Active",
          notes: normalizeText(json.data.notes),

          meetPoints: normalizeText(json.data.meetPoints),
          arxPoints: normalizeText(json.data.arxPoints),
          narxPoints: normalizeText(json.data.narxPoints),
          showPoints: normalizeText(json.data.showPoints),
          dpcLegs: normalizeText(json.data.dpcLegs),
          meetWins: normalizeText(json.data.meetWins),
          meetAppearences: normalizeText(json.data.meetAppearences),
          highCombinedWins: normalizeText(json.data.highCombinedWins),
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load dog.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authorized, id]);

  function updateField<K extends keyof DogFormValues>(key: K, value: DogFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: DogFormValues = {
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

      setSuccess("Dog information updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#1F4D2E] text-white">
        Checking access...
      </main>
    );
  }

  if (!authorized) return null;

  return (
    <main className="pt-24 bg-[#1F4D2E]">
      <section className="relative pt-16 pb-40 bg-gradient-to-b from-[#1F4D2E] to-[#18452A] overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-36 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-24 left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-[#2E6B3F]/25 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center">
          <div className="w-full max-w-3xl text-center">
            <div className="mb-4 flex items-center justify-center gap-3 text-sm text-white/75">
              <Link
                href="/admin/dogs"
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/15 transition"
              >
                ← Back to Admin Dogs
              </Link>
            </div>

            <h1 className="text-white text-5xl font-bold tracking-tight">
              Edit Dog
            </h1>

            <p className="mt-3 text-white/70">
              Update dog information securely through the admin panel.
            </p>

            <div className="mt-5 text-sm text-white/70">
              {loading
                ? "Loading dog information..."
                : error
                ? `Error: ${error}`
                : success
                ? success
                : `Editing record #${id}`}
            </div>
          </div>
        </div>

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

      <section className="bg-[#E7F0E9] pt-12 pb-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#12301D]">Dog Information</h2>
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
            onCancel={() => router.push("/admin/dogs")}
          />
        </div>
      </section>

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

