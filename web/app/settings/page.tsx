"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type MeUser = {
  PersonID: string;
  FirstName?: string;
  LastName?: string;
  EmailAddress?: string;
  SystemRole?: string;
};

type Profile = {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  addressLineOne?: string;
  addressLineTwo?: string;
  city?: string;
  stateProvince?: string;
  zipCode?: string;
  country?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  notes?: string;
};

export default function SettingsPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [me, setMe] = useState<MeUser | null>(null);

  // Profile
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileStatus, setProfileStatus] = useState<"idle" | "success" | "error">("idle");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "success" | "error">("idle");

  // Delete account
  const [deleteText, setDeleteText] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "success" | "error">("idle");

  // Auth gate
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json().catch(() => null);

        if (!cancelled && data?.user?.PersonID) {
          setMe(data.user as MeUser);
          setCheckingAuth(false);
        } else {
          window.location.replace("/login");
        }
      } catch {
        window.location.replace("/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load profile
  useEffect(() => {
    if (!me?.PersonID) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/person/get/${encodeURIComponent(me.PersonID)}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) {
            setProfile({
              personId: me.PersonID,
              firstName: me.FirstName || "",
              lastName: me.LastName || "",
              email: me.EmailAddress || "",
              addressLineOne: "",
              addressLineTwo: "",
              city: "",
              stateProvince: "",
              zipCode: "",
              country: "",
              primaryPhone: "",
              secondaryPhone: "",
              notes: "",
            });
          }
          return;
        }

        const raw = (await res.json().catch(() => null)) as any;

        const p: Profile = {
          personId: raw?.personId ?? raw?.PersonID ?? me.PersonID,
          firstName: raw?.firstName ?? raw?.FirstName ?? "",
          lastName: raw?.lastName ?? raw?.LastName ?? "",
          email: raw?.email ?? raw?.EmailAddress ?? "",
          addressLineOne: raw?.addressLineOne ?? raw?.AddressLineOne ?? "",
          addressLineTwo: raw?.addressLineTwo ?? raw?.AddressLineTwo ?? "",
          city: raw?.city ?? raw?.City ?? "",
          stateProvince: raw?.stateProvince ?? raw?.StateProvince ?? "",
          zipCode: raw?.zipCode ?? raw?.ZipCode ?? "",
          country: raw?.country ?? raw?.Country ?? "",
          primaryPhone: raw?.primaryPhone ?? raw?.PrimaryPhone ?? "",
          secondaryPhone: raw?.secondaryPhone ?? raw?.SecondaryPhone ?? "",
          notes: raw?.notes ?? raw?.Notes ?? "",
        };

        if (!cancelled) setProfile(p);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [me?.PersonID]);

  const canSaveProfile = useMemo(() => {
    if (!profile) return false;
    return (
      profile.firstName.trim().length > 0 &&
      profile.lastName.trim().length > 0 &&
      profile.email.trim().length > 0 &&
      !profileSubmitting
    );
  }, [profile, profileSubmitting]);

  const canChangePassword = useMemo(() => {
    return currentPassword.trim().length > 0 && newPassword.trim().length >= 6 && !pwSubmitting;
  }, [currentPassword, newPassword, pwSubmitting]);

  const canDelete = useMemo(() => {
    return deleteText.trim().toUpperCase() === "DELETE" && !deleteSubmitting;
  }, [deleteText, deleteSubmitting]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setProfileMsg("");
    setProfileStatus("idle");
    setProfileSubmitting(true);

    try {
      const res = await fetch("/api/person/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          personId: profile.personId,
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          email: profile.email.trim(),
          addressLineOne: profile.addressLineOne || "",
          addressLineTwo: profile.addressLineTwo || "",
          city: profile.city || "",
          stateProvince: profile.stateProvince || "",
          zipCode: profile.zipCode || "",
          country: profile.country || "",
          primaryPhone: profile.primaryPhone || "",
          secondaryPhone: profile.secondaryPhone || "",
          notes: profile.notes || "",
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setProfileStatus("success");
        setProfileMsg("Profile saved.");
        return;
      }

      setProfileStatus("error");
      setProfileMsg(data?.error || "Failed to save profile");
    } catch (err: any) {
      setProfileStatus("error");
      setProfileMsg(err?.message || "Failed to save profile");
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();

    setPwMsg("");
    setPwStatus("idle");
    setPwSubmitting(true);

    try {
      const res = await fetch("/api/person/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setPwStatus("success");
        setPwMsg("Password updated.");
        setCurrentPassword("");
        setNewPassword("");
        return;
      }

      setPwStatus("error");
      setPwMsg(data?.error || "Failed to update password");
    } catch (err: any) {
      setPwStatus("error");
      setPwMsg(err?.message || "Failed to update password");
    } finally {
      setPwSubmitting(false);
    }
  }

  async function deleteAccount() {
    setDeleteMsg("");
    setDeleteStatus("idle");
    setDeleteSubmitting(true);

    try {
      const res = await fetch("/api/person/delete-self", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setDeleteStatus("success");
        setDeleteMsg("Account deleted. Redirecting…");
        window.location.replace("/");
        return;
      }

      setDeleteStatus("error");
      setDeleteMsg(data?.error || "Failed to delete account");
    } catch (err: any) {
      setDeleteStatus("error");
      setDeleteMsg(err?.message || "Failed to delete account");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.replace("/");
    }
  }

  if (checkingAuth) return null;
  if (!me) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-100 to-neutral-200 p-6 pt-28 sm:pt-32">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="rounded-3xl bg-white/80 backdrop-blur shadow-xl border border-neutral-200 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Signed in as <span className="font-medium text-neutral-900">{me.PersonID}</span>
                {me.SystemRole ? (
                  <span className="ml-2 inline-flex items-center rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-700">
                    {me.SystemRole}
                  </span>
                ) : null}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl px-4 py-2 font-medium border border-neutral-300 bg-black text-white hover:bg-neutral-900 transition"
            >
              Log out
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Profile */}
          <section className="rounded-3xl bg-white/80 backdrop-blur shadow-xl border border-neutral-200 p-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Profile</h2>

            {!profile ? (
              <p className="text-sm text-neutral-600">Loading profile…</p>
            ) : (
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="First name" value={profile.firstName} onChange={(v) => setProfile({ ...profile, firstName: v })} />
                  <Field label="Last name" value={profile.lastName} onChange={(v) => setProfile({ ...profile, lastName: v })} />
                </div>

                <Field label="Email" type="email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} autoComplete="email" />

                <Field label="Address line 1" value={profile.addressLineOne || ""} onChange={(v) => setProfile({ ...profile, addressLineOne: v })} />
                <Field label="Address line 2" value={profile.addressLineTwo || ""} onChange={(v) => setProfile({ ...profile, addressLineTwo: v })} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="City" value={profile.city || ""} onChange={(v) => setProfile({ ...profile, city: v })} />
                  <Field label="State/Province" value={profile.stateProvince || ""} onChange={(v) => setProfile({ ...profile, stateProvince: v })} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Zip code" value={profile.zipCode || ""} onChange={(v) => setProfile({ ...profile, zipCode: v })} />
                  <Field label="Country" value={profile.country || ""} onChange={(v) => setProfile({ ...profile, country: v })} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Primary phone" value={profile.primaryPhone || ""} onChange={(v) => setProfile({ ...profile, primaryPhone: v })} autoComplete="tel" />
                  <Field label="Secondary phone" value={profile.secondaryPhone || ""} onChange={(v) => setProfile({ ...profile, secondaryPhone: v })} autoComplete="tel" />
                </div>

                <TextArea label="Notes" value={profile.notes || ""} onChange={(v) => setProfile({ ...profile, notes: v })} />

                <button
                  type="submit"
                  disabled={!canSaveProfile}
                  className="w-full rounded-xl px-4 py-2.5 font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition"
                >
                  {profileSubmitting ? "Saving…" : "Save profile"}
                </button>

                {profileMsg && <StatusBox status={profileStatus} message={profileMsg} />}
              </form>
            )}
          </section>

          <div className="space-y-6">
            {/* Security */}
            <section className="rounded-3xl bg-white/80 backdrop-blur shadow-xl border border-neutral-200 p-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Security</h2>

              <form onSubmit={changePassword} className="space-y-4">
                <Field label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
                <Field label="New password" type="password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" placeholder="At least 6 characters" />

                <button
                  type="submit"
                  disabled={!canChangePassword}
                  className="w-full rounded-xl px-4 py-2.5 font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition"
                >
                  {pwSubmitting ? "Updating…" : "Update password"}
                </button>

                {pwMsg && <StatusBox status={pwStatus} message={pwMsg} />}
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const { label, value, onChange, type = "text", placeholder, autoComplete } = props;

  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-800">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400
                   focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-300"
      />
    </label>
  );
}

function TextArea(props: { label: string; value: string; onChange: (v: string) => void }) {
  const { label, value, onChange } = props;
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-800">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400
                   focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-300"
      />
    </label>
  );
}

function StatusBox({ status, message }: { status: "idle" | "success" | "error"; message: string }) {
  const cls =
    status === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : status === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-neutral-200 bg-neutral-50 text-neutral-700";

  return (
    <div className={["rounded-xl border px-3 py-2 text-sm", cls].join(" ")} role="status">
      {message}
    </div>
  );
}
