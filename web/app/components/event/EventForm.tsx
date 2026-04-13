// EventForm.tsx
"use client";

import * as React from "react";
import type { EventFormValues } from "@/app/admin/events/types";

type Props = {
    values: EventFormValues;
    onChange: <K extends keyof EventFormValues>(
        key: K,
        value: EventFormValues[K]
    ) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    saving: boolean;
    submitLabel: string;
    error: string;
    success: string;
    onCancel: () => void;
    isEditMode?: boolean;
    canEditPrivateNotes?: boolean;
};

type InputFieldProps = {
    label: string;
    field: keyof EventFormValues;
    value: string;
    onChange: <K extends keyof EventFormValues>(
        key: K,
        value: EventFormValues[K]
    ) => void;
    placeholder?: string;
    type?: string;
    readOnly?: boolean;
    className?: string;
};

type TextAreaFieldProps = {
    label: string;
    field: keyof EventFormValues;
    value: string;
    onChange: <K extends keyof EventFormValues>(
        key: K,
        value: EventFormValues[K]
    ) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
};

function InputField({
    label,
    field,
    value,
    onChange,
    placeholder,
    type = "text",
    readOnly = false,
    className = "",
}: InputFieldProps) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-medium text-[#12301D]">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(e) => onChange(field, e.target.value)}
                placeholder={placeholder}
                readOnly={readOnly}
                className={
                    readOnly
                        ? "mt-1 block w-full rounded-md border px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
                }
            />
        </div>
    );
}

function TextAreaField({
    label,
    field,
    value,
    onChange,
    placeholder,
    rows = 5,
    className = "",
}: TextAreaFieldProps) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-medium text-[#12301D]">
                {label}
            </label>

            <textarea
                value={value}
                onChange={(e) => onChange(field, e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
            />
        </div>
    );
}

export default function EventForm({
    values,
    onChange,
    onSubmit,
    saving,
    submitLabel,
    error,
    success,
    onCancel,
    isEditMode = false,
    canEditPrivateNotes = false,
}: Props) {
    const standardFields: Array<{
        label: string;
        field: keyof EventFormValues;
        placeholder?: string;
        type?: string;
    }> = [
        {
            label: "Club Abbreviation",
            field: "clubAbbreviation",
            placeholder: "AAWC, BWA, CMANYWHIPS, DWC, WINE, SMART, etc.",
        },
        {
            label: "Location",
            field: "location",
        },
        {
            label: "Meet Date",
            field: "meetDate",
            type: "date",
        },
        {
            label: "Race Secretary",
            field: "raceSecretary",
        },
        {
            label: "Judge",
            field: "judge",
        },
        {
            label: "Yards",
            field: "yards",
            type: "text",
        },
    ];

    return (
        <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm backdrop-blur md:p-8"
        >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <InputField
                    label="Meet Number"
                    field="meetNumber"
                    value={values.meetNumber}
                    onChange={onChange}
                    placeholder="1234, 3124, 8754, etc."
                    readOnly={isEditMode}
                />

                {standardFields.map((fieldConfig) => (
                    <InputField
                        key={String(fieldConfig.field)}
                        label={fieldConfig.label}
                        field={fieldConfig.field}
                        value={values[fieldConfig.field]}
                        onChange={onChange}
                        placeholder={fieldConfig.placeholder}
                        type={fieldConfig.type}
                    />
                ))}
            </div>

            <div className="mt-6 space-y-5">
                <TextAreaField
                    label="Notes"
                    field="publicNotes"
                    value={values.publicNotes}
                    onChange={onChange}
                    placeholder="Enter notes for this meet."
                />

                {canEditPrivateNotes && (
                    <TextAreaField
                        label="Private Notes"
                        field="privateNotes"
                        value={values.privateNotes}
                        onChange={onChange}
                        placeholder="Admin-only notes."
                    />
                )}
            </div>

            {(error || success) && (
                <div
                    className={[
                        "mt-5 rounded-2xl border px-4 py-3 text-sm",
                        error
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-green-200 bg-green-50 text-green-700",
                    ].join(" ")}
                >
                    {error || success}
                </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#255733] disabled:opacity-60"
                >
                    {saving ? "Saving..." : submitLabel}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] transition hover:bg-[#12301D]/5"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}