// DogForm.tsx
"use client";

import * as React from "react";
import type { DogFormValues } from "@/app/admin/dogs/types";
import RichTextEditor from "@/lib/richtext/RichTextEditor";
import FieldLabel from "@/app/components/ui/FieldLabel"
import InputField from "@/app/components/ui/InputField";
type Props =
    {
        values: DogFormValues;
        onChange: <K extends keyof DogFormValues>
            (
                key: K,
                value: DogFormValues[K]
            ) => void;
        onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
        error: string;
        success: string;

        // Kept for compatibility with the current parent props.
        form: DogFormValues;
        setForm: React.Dispatch<React.SetStateAction<DogFormValues>>;

        // If true, user is editing an existing dog,
        // so the CWA number should not be changed.
        isEditMode?: boolean;
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
        required: boolean
    };

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
            required = false,
        }: SelectFieldProps
    ) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-medium text-[#12301D]">
                <FieldLabel label={label} required={required} />
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
            error,
            success,
            isEditMode = false,
        }: Props
    ) {

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
        Score fields that support manual adjustments. Each entry maps to its
        corresponding manual*Adjustment field for display.
    */
    const scoreFields:
        Array<
            {
                label: string;
                field: keyof DogFormValues;
                adjustmentField: keyof DogFormValues;
            }
        > =
        [
            {
                label: "Meet Points",
                field: "meetPoints",
                adjustmentField: "manualMeetPointsAdjustment",
            },
            {
                label: "ARX Points",
                field: "arxPoints",
                adjustmentField: "manualArxPointsAdjustment",
            },
            {
                label: "NARX Points",
                field: "narxPoints",
                adjustmentField: "manualNarxPointsAdjustment",
            },
            {
                label: "Show Points",
                field: "showPoints",
                adjustmentField: "manualShowPointsAdjustment",
            },
            {
                label: "DPC Points",
                field: "dpcPoints",
                adjustmentField: "manualDpcPointsAdjustment",
            },
            {
                label: "DPC Legs",
                field: "dpcLegs",
                adjustmentField: "manualDPCLegsAdjustment",
            },
            {
                label: "Meet Wins",
                field: "meetWins",
                adjustmentField: "manualMeetWinsAdjustment",
            },
            {
                label: "Meet Appearences",
                field: "meetAppearences",
                adjustmentField: "manualMeetAppearancesAdjustment",
            },
            {
                label: "High Combined Wins",
                field: "highCombinedWins",
                adjustmentField: "manualHighCombinedWinsAdjustment",
            },
        ];

    return (
        <form
            id="dog-form"
            onSubmit={onSubmit}
            className="rounded-3xl border border-black/10 bg-white/90 backdrop-blur p-6 md:p-8 shadow-sm"
        >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 
                    CWA Number has special read-only behavior in edit mode,
                    so it stays as its own field outside the mapped list.
                */}
                <InputField
                    label="CWA Number"
                    value={values.cwaNumber}
                    onChange={(v) => onChange("cwaNumber", v)}
                    placeholder="1234, 3124, 8754, etc."
                    readOnly={isEditMode}
                    required={true}
                />

                <InputField
                    label="Registered Name"
                    value={(values.registeredName ?? "") as string}
                    onChange={(v) => onChange("registeredName", v)}
                    required={true}
                />,
                <InputField
                    label="Call Name"
                    value={(values.callName ?? "") as string}
                    onChange={(v) => onChange("callName", v)}
                    placeholder="One name like Bob, Sally, etc."
                    required={true}
                />,
                <InputField
                    label="Birthdate"
                    value={(values.birthdate ?? "") as string}
                    onChange={(v) => onChange("birthdate", v)}
                    type="date"
                    required={true}
                />,
                <InputField
                    label="Registered Number"
                    value={(values.registeredNumber ?? "") as string}
                    onChange={(v) => onChange("registeredNumber", v)}
                    required={false}
                />,
                <InputField
                    label="DNA"
                    value={(values.dna ?? "") as string}
                    onChange={(v) => onChange("dna", v)}
                    required={false}
                />,
                <InputField
                    label="Sire DNA"
                    value={(values.sireDna ?? "") as string}
                    onChange={(v) => onChange("sireDna", v)}
                    required={false}
                />,
                <InputField
                    label="Dam DNA"
                    value={(values.damDna ?? "") as string}
                    onChange={(v) => onChange("damDna", v)}
                    required={false}
                />,
                <InputField
                    label="Registry Type"
                    value={(values.foreignType ?? "") as string}
                    onChange={(v) => onChange("foreignType", v)}
                    required={false}
                />

                {
                    scoreFields.map
                        (
                            (fieldConfig) => {
                                const adjustmentValue = values[fieldConfig.adjustmentField] as unknown as number;
                                return (
                                    <div key={String(fieldConfig.field)}>
                                        <InputField
                                            label={fieldConfig.label}
                                            value={values[fieldConfig.field] as string}
                                            onChange={(v) => onChange(fieldConfig.field, v)}
                                            type="number"
                                            required={false}
                                        />
                                        <div className="mt-1.5 text-xs text-gray-500">
                                            Manual adjustment: {values[fieldConfig.field] as unknown as number - adjustmentValue}
                                        </div>
                                    </div>
                                );
                            }
                        )
                }

                <SelectField
                    label="Grade"
                    field="currentGrade"
                    value={values.currentGrade}
                    onChange={onChange}
                    options={gradeOptions}
                    placeholder="Select a grade"
                    required={true}
                />

                <SelectField
                    label="Status"
                    field="status"
                    value={values.status}
                    onChange={onChange}
                    options={statusOptions}
                    placeholder="Select a status"
                    required={true}
                />

                <InputField
                    label="Pedigree Link"
                    onChange={(v) => onChange("pedigreeLink", v)}
                    value={values.pedigreeLink}
                    className="md:col-span-2"
                />
                <div className="md:col-span-2 flex flex-row justify-between">
                    <InputField
                        label="Historical Meet Points 1"
                        value={values.historicalMeetPoints1 || ''}
                        onChange={(v) => onChange("historicalMeetPoints1", v)}
                        placeholder="Historical Meet Points 1"
                        type="number"
                    />
                    <InputField
                        label="Historical Meet Points 2"
                        value={values.historicalMeetPoints2 || ''}
                        onChange={(v) => onChange("historicalMeetPoints2", v)}
                        placeholder="Historical Meet Points 2"
                        type="number"
                    />
                    <InputField
                        label="Historical Meet Points 3"
                        value={values.historicalMeetPoints3 || ''}
                        onChange={(v) => onChange("historicalMeetPoints3", v)}
                        placeholder="Historical Meet Points 3"
                        type="number"
                    />
                </div>

                <div className="md:col-span-2">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={values.kennelClubChampion}
                            onChange={(e) => onChange("kennelClubChampion", e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-[#2E6B3F] focus:ring-[#2E6B3F]"
                        />
                        <span className="text-sm text-[#12301D]">
                            Kennel Club Champion
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-[#12301D]">
                    Public Notes
                </label>
                <RichTextEditor value={values.publicNotes} onChange={(value: string) => onChange("publicNotes", value)} style={{}} />
            </div>

            <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-[#12301D]">
                    Private Notes
                </label>
                <RichTextEditor value={values.privateNotes} onChange={(value: string) => onChange("privateNotes", value)} style={{}} />
            </div>

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
        </form>
    );
}
