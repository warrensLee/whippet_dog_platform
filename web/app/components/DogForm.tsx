"use client";

import * as React from "react";
import type { DogFormValues } from "@/lib/search/types.ts";

type Props = {
  values: DogFormValues;
  onChange: <K extends keyof DogFormValues>(key: K, value: DogFormValues[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  submitLabel: string;
  error: string;
  success: string;
  onCancel: () => void;
};

export default function DogForm({
  values,
  onChange,
  onSubmit,
  saving,
  submitLabel,
  error,
  success,
  onCancel,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-black/10 bg-white/90 backdrop-blur p-6 md:p-8 shadow-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">CWA Number</label>
          <input
            value={values.cwaNumber}
            onChange={(e) => onChange("cwaNumber", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Registered Name</label>
          <input
            value={values.registeredName}
            onChange={(e) => onChange("registeredName", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Call Name</label>
          <input
            value={values.callName}
            onChange={(e) => onChange("callName", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Birthdate</label>
          <input
            type="date"
            value={values.birthdate}
            onChange={(e) => onChange("birthdate", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">AKC Number</label>
          <input
            value={values.akcNumber}
            onChange={(e) => onChange("akcNumber", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">CKC Number</label>
          <input
            value={values.ckcNumber}
            onChange={(e) => onChange("ckcNumber", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Grade</label>
          <input
            value={values.currentGrade}
            onChange={(e) => onChange("currentGrade", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Foreign Number</label>
          <input
            value={values.foreignNumber}
            onChange={(e) => onChange("foreignNumber", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Foreign Type</label>
          <input
            value={values.foreignType}
            onChange={(e) => onChange("foreignType", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Pedigree Link</label>
          <input
            value={values.pedigreeLink}
            onChange={(e) => onChange("pedigreeLink", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Status</label>
          <input
            value={values.status}
            onChange={(e) => onChange("status", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-medium text-[#12301D]">Notes</label>
        <textarea
          value={values.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={5}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
        />
      </div>

      {(error || success) && (
        <div
          className={[
            "mt-5 rounded-2xl border px-4 py-3 text-sm",
            error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700",
          ].join(" ")}
        >
          {error || success}
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60"
        >
          {saving ? "Saving..." : submitLabel}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}