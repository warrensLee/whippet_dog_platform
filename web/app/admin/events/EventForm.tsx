// EventForm.tsx
"use client";

import * as React from "react";
import type { EventFormValues } from "@/app/admin/events/types";
import RichTextEditor from "@/lib/richtext/RichTextEditor";
import PersonField, { PersonSearchResult } from "@/app/components/ui/PersonField";
import FieldLabel from "@/app/components/ui/FieldLabel";
import InputField from "@/app/components/ui/InputField";
type Props = {
    values: EventFormValues;
    onChange: (
        value: EventFormValues
    ) => void;
    isEditMode?: boolean;
    canEditPrivateNotes?: boolean;
    personLoading?: boolean;
};

type PersonSelectFieldProps = {
    label: string;
    value: PersonSearchResult | null | undefined;
    onChange: (
        value: PersonSearchResult | undefined
    ) => void;
    loading: boolean
    className?: string;
    required?: boolean
};
function PersonSelectField({
    label,
    value,
    onChange,
    loading = false,
    className = "",
    required = false
}: PersonSelectFieldProps) {

    return (
        <div className={className}>
            <FieldLabel label={label} required={required} />
            <PersonField value={value} onChange={onChange} readOnly={loading} />
        </div>
    );
}


export default function EventForm({
    values,
    onChange,
    isEditMode = false,
    canEditPrivateNotes = false,
    personLoading = false,
}: Props) {

    function updateField<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
        onChange({ ...values, [key]: value, });
    }

    return (
        <div
            className="rounded-3xl border-black/10 bg-white/90 p-6 md:p-6"
        >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <InputField
                    label="Meet Number"
                    value={values.meetNumber}
                    onChange={(v) => updateField("meetNumber", v)}
                    placeholder="1234, 3124, 8754, etc."
                    readOnly={isEditMode}
                    required={true}
                />
                <InputField
                    label="Club Abbreviation"
                    value={values.clubAbbreviation as string}
                    onChange={(v) => updateField("clubAbbreviation", v)}
                    placeholder="AAWC, BWA, CMANYWHIPS, DWC, WINE, SMART, etc."
                    required={true}
                />
                <InputField
                    label="Location"
                    value={values.location as string}
                    onChange={(v) => updateField("location", v)}
                    required={true}
                />
                <InputField
                    label="Meet Date"
                    value={values.meetDate as string}
                    onChange={(v) => updateField("meetDate", v)}
                    type="date"
                    required={true}
                />
                <InputField
                    label="Yards"
                    value={values.yards as string}
                    onChange={(v) => updateField("yards", v)}
                    type="text"
                    required={true}
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <PersonSelectField
                    label="Race Secretary"
                    className="text-sm"
                    value={values.raceSecretary}
                    onChange={(result) => updateField("raceSecretary", result)}
                    loading={personLoading}
                    required={true}
                />
                <PersonSelectField
                    label="Judge"
                    className="text-sm"
                    value={values.judge}
                    onChange={(result) => updateField("judge", result)}
                    loading={personLoading}
                    required={true}
                />
            </div>

            <div className="mt-6 space-y-5">
                <label className="mb-2 block text-sm font-medium text-[#12301D]">
                    Public Notes
                </label>
                <RichTextEditor value={values.publicNotes} style={{}} onChange={(s) => updateField("publicNotes", s)} />

                {canEditPrivateNotes && (
                    <div><label className="mb-2 block text-sm font-medium text-[#12301D]">
                        Private Notes
                    </label>
                        <RichTextEditor value={values.privateNotes} style={{}} onChange={(s) => updateField("privateNotes", s)} /></div>
                )}
            </div>
        </div>
    );
}
