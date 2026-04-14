// DogForm.tsx
"use client";

import * as React from "react";
import type { DogFormValues } from "@/app/admin/dogs/types";
import RichTextEditor from "@/lib/richtext/RichTextEditor";

type Props =
    {
        values: DogFormValues;
        onChange: <K extends keyof DogFormValues>
            (
                key: K,
                value: DogFormValues[K]
            ) => void;
        onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
        saving: boolean;
        submitLabel: string;
        error: string;
        success: string;
        onCancel: () => void;

        // Kept for compatibility with the current parent props.
        form: DogFormValues;
        setForm: React.Dispatch<React.SetStateAction<DogFormValues>>;

        // If true, user is editing an existing dog,
        // so the CWA number should not be changed.
        isEditMode?: boolean;
    };

type InputFieldProps =
    {
        label: string;
        field: keyof DogFormValues;
        value: string;
        onChange: <K extends keyof DogFormValues>
            (
                key: K,
                value: DogFormValues[K]
            ) => void;
        placeholder?: string;
        type?: string;
        readOnly?: boolean;
        className?: string;
    };

type TextAreaFieldProps =
    {
        label: string;
        field: keyof DogFormValues;
        value: string;
        onChange: <K extends keyof DogFormValues>
            (
                key: K,
                value: DogFormValues[K]
            ) => void;
        placeholder?: string;
        rows?: number;
        className?: string;
    };

type SelectFieldProps =
    {
        label: string;
        field: keyof DogFormValues;
        value: string;
        onChange: <K extends keyof DogFormValues>
            (
                key: K,
                value: DogFormValues[K]
            ) => void;
        options: string[];
        placeholder?: string;
        className?: string;
    };

/*
    Reusable single-line input field.

    Used for most normal text/date inputs in the dog form.
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

export default function DogForm
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
        Valid options for dropdown-backed fields. They will 
        be used for input validation in edit / add mode.
    */
    const gradeOptions =
        [
            "FTE",
            "D",
            "C",
            "B",
            "A",
        ];

    const statusOptions =
        [
            "Active",
            "Inactive",
        ];

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
                field: keyof DogFormValues;
                placeholder?: string;
                type?: string;
            }
        > =
        [
            {
                label: "Registered Name",
                field: "registeredName",
            },
            {
                label: "Call Name",
                field: "callName",
                placeholder: "One name like Bob, Sally, etc.",
            },
            {
                label: "Birthdate",
                field: "birthdate",
                type: "date",
            },
            {
                label: "Registered Number",
                field: "registeredNumber",
            },
            {
                label: "DNA",
                field: "dna",
            },
            {
                label: "Sire DNA",
                field: "sireDna",
            },
            {
                label: "Dam DNA",
                field: "damDna",
            },
            {
                label: "Meet Points",
                field: "meetPoints",
                type: "number",
            },
            {
                label: "Arx Points",
                field: "arxPoints",
                type: "number",
            },
            {
                label: "Narx Points",
                field: "narxPoints",
                type: "number",
            },
            {
                label: "Show Points",
                field: "showPoints",
                type: "number",
            },
            {
                label: "DPC Legs",
                field: "dpcLegs",
                type: "number",
            },
            {
                label: "Meet Wins",
                field: "meetWins",
                type: "number",
            },
            {
                label: "Meet Appearences",
                field: "meetAppearences",
                type: "number",
            },
            {
                label: "High Combined Wins",
                field: "highCombinedWins",
                type: "number",
            },
            {
                label: "Registry Type",
                field: "foreignType",
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
                    CWA Number has special read-only behavior in edit mode,
                    so it stays as its own field outside the mapped list.
                */}
                <InputField
                    label="CWA Number"
                    field="cwaNumber"
                    value={values.cwaNumber}
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

                {/* Grade dropdown */}
                <SelectField
                    label="Grade"
                    field="currentGrade"
                    value={values.currentGrade}
                    onChange={onChange}
                    options={gradeOptions}
                    placeholder="Select a grade"
                />

                {/* Status dropdown */}
                <SelectField
                    label="Status"
                    field="status"
                    value={values.status}
                    onChange={onChange}
                    options={statusOptions}
                    placeholder="Select a status"
                />

                {/* Pedigree Link spans both columns */}
                <InputField
                    label="Pedigree Link"
                    field="pedigreeLink"
                    value={values.pedigreeLink}
                    onChange={onChange}
                    className="md:col-span-2"
                />
            </div>

            {/* Public Notes section */}
            <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-[#12301D]">
                    Public Notes
                </label>
                <RichTextEditor value={values.publicNotes} onChange={(value: string) => onChange("publicNotes", value)} style={{}} />
            </div>

            {/* Private Notes section */}
            <div className="mt-5">
                <TextAreaField
                    label="Private Notes"
                    field="privateNotes"
                    value={values.privateNotes}
                    onChange={onChange}
                    placeholder="Anything relevant to this dog..."
                    rows={5}
                />
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