"use client";

import * as React from "react";
import type { DogFormValues } from "@/lib/search/types.ts";


type Props = 
{
  values: DogFormValues;
  onChange: <K extends keyof DogFormValues>(key: K, value: DogFormValues[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  submitLabel: string;
  error: string;
  success: string;
  onCancel: () => void;
  form: DogFormValues;
  setForm: React.Dispatch<React.SetStateAction<DogFormValues>>;

  isEditMode?: boolean;
};

export default function DogForm
({
  values,
  onChange,
  onSubmit,
  saving,
  submitLabel,
  error,
  success,
  onCancel,
  form,
  setForm,
  isEditMode = false,

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
            placeholder="1234, 3124, 8754, etc."
            //className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
            readOnly={isEditMode}
            className={`mt-1 block w-full rounded-md border px-3 py-2 ${
              isEditMode ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"
            }`}
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
            placeholder="One name like Bob, Sally, etc."
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
            placeholder="A, B, C, D, or FTE (failed to enter)"
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
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Meet Points</label>
          <input
            value={values.meetPoints}
            onChange={(e) => onChange("meetPoints", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Arx Points</label>
          <input
            value={values.arxPoints}
            onChange={(e) => onChange("arxPoints", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Narx Points</label>
          <input
            value={values.narxPoints}
            onChange={(e) => onChange("narxPoints", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Show Points</label>
          <input
            value={values.showPoints}
            onChange={(e) => onChange("showPoints", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">DPC Legs</label>
          <input
            value={values.dpcLegs}
            onChange={(e) => onChange("dpcLegs", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Meet Wins</label>
          <input
            value={values.meetWins}
            onChange={(e) => onChange("meetWins", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">Meet Appearences</label>
          <input
            value={values.meetAppearences}
            onChange={(e) => onChange("meetAppearences", e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#12301D]">High Combined Wins</label>
          <input
            value={values.highCombinedWins}
            onChange={(e) => onChange("highCombinedWins", e.target.value)}
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
          placeholder="Anything relevant to this dog..."
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