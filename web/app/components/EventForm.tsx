// MeetForm.tsx
"use client";

import * as React from "react";
import type { MeetFormValues } from "@/app/admin/events/types";

type Props =
    {
        values: MeetFormValues;
        onChange: <K extends keyof MeetFormValues>
            (
                key: K,
                value: MeetFormValues[K]
            ) => void;
        onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
        saving: boolean;
        submitLabel: string;
        error: string;
        success: string;
        onCancel: () => void;

        // If true, user is editing an existing Event,
        // so the CWA number should not be changed.
        isEditMode?: boolean;
    };

type InputFieldProps =
    {
        label: string;
        field: keyof MeetFormValues;
        value: string;
        onChange: <K extends keyof MeetFormValues>
            (
                key: K,
                value: MeetFormValues[K]
            ) => void;
        placeholder?: string;
        type?: string;
        readOnly?: boolean;
        className?: string;
    };

type TextAreaFieldProps =
    {
        label: string;
        field: keyof MeetFormValues;
        value: string;
        onChange: <K extends keyof MeetFormValues>
            (
                key: K,
                value: MeetFormValues[K]
            ) => void;
        placeholder?: string;
        rows?: number;
        className?: string;
    };

type SelectFieldProps =
    {
        label: string;
        field: keyof MeetFormValues;
        value: string;
        onChange: <K extends keyof MeetFormValues>
            (
                key: K,
                value: MeetFormValues[K]
            ) => void;
        options: string[];
        placeholder?: string;
        className?: string;
    };

/*
    Reusable single-line input field.

    Used for most normal text/date inputs in the Meet form.
*/
function InputField
    (
        {
            label,
            field,
            value,
            onChange,
            placeholder,
            type = "text",
            readOnly = false,
            className = "",
        }: InputFieldProps
    ) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-medium text-[#12301D]">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={
                    (e) => {
                        onChange(field, e.target.value);
                    }
                }
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

/*
    Reusable textarea field.

    Used for notes or any longer free-form content.
*/
function TextAreaField
    (
        {
            label,
            field,
            value,
            onChange,
            placeholder,
            rows = 5,
            className = "",
        }: TextAreaFieldProps
    ) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-medium text-[#12301D]">
                {label}
            </label>

            <textarea
                value={value}
                onChange={
                    (e) => {
                        onChange(field, e.target.value);
                    }
                }
                placeholder={placeholder}
                rows={rows}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
            />
        </div>
    );
}

/*
    Reusable dropdown/select field.

    This is better for fields with a known fixed set of valid values,
    such as grade and status.
*/
function SelectField
    (
        {
            label,
            field,
            value,
            onChange,
            options,
            placeholder = "Select an option",
            className = "",
        }: SelectFieldProps
    ) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-medium text-[#12301D]">
                {label}
            </label>

            <select
                value={value}
                onChange={
                    (e) => {
                        onChange(field, e.target.value);
                    }
                }
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
            >
                <option value="">
                    {placeholder}
                </option>

                {
                    options.map
                        (
                            (option) => {
                                return (
                                    <option
                                        key={option}
                                        value={option}
                                    >
                                        {option}
                                    </option>
                                );
                            }
                        )
                }
            </select>
        </div>
    );
}

export default function MeetForm
    (
        {
            values,
            onChange,
            onSubmit,
            saving,
            submitLabel,
            error,
            success,
            onCancel,
            isEditMode = false,
        }: Props
    ) {

    /*
        standardFields is a config list that defines the label, form field key, 
        and other properties for each of the many standard text/date/number inputs 
        in the form.

        In short these inputs are still standard text/date/number fields, but 
        they have a lot of overlap in styling and behavior, so it made sense 
        to map them from a config list instead of hardcoding each one.
    */
    const standardFields:
        Array<
            {
                label: string;
                field: keyof MeetFormValues;
                placeholder?: string;
                type?: string;
            }
        > =
        [
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
                type: "number",
            },
        ];

    return (
        <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-black/10 bg-white/90 backdrop-blur p-6 md:p-8 shadow-sm"
        >
            {/* 
                Main grid for the form.
                One column on smaller screens, two columns on medium+.
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 
                    Meet Number has special read-only behavior in edit mode,
                    so it stays as its own field outside the mapped list.
                */}
                <InputField
                    label="Meet Number"
                    field="meetNumber"
                    value={values.meetNumber}
                    onChange={onChange}
                    placeholder="1234, 3124, 8754, etc."
                    readOnly={isEditMode}
                />

                {/* Render standard text/date fields from the config list */}
                {
                    standardFields.map
                        (
                            (fieldConfig) => {
                                return (
                                    <InputField
                                        key={String(fieldConfig.field)}
                                        label={fieldConfig.label}
                                        field={fieldConfig.field}
                                        value={values[fieldConfig.field]}
                                        onChange={onChange}
                                        placeholder={fieldConfig.placeholder}
                                        type={fieldConfig.type}
                                    />
                                );
                            }
                        )
                }
            </div>
            {/* Show either error or success message if present */}
            {
                (error || success) && (
                    <div
                        className={
                            [
                                "mt-5 rounded-2xl border px-4 py-3 text-sm",
                                error
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-green-200 bg-green-50 text-green-700",
                            ].join(" ")
                        }
                    >
                        {error || success}
                    </div>
                )
            }

            {/* Action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60"
                >
                    {
                        saving
                            ? "Saving..."
                            : submitLabel
                    }
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