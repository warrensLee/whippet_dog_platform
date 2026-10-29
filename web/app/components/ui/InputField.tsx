import { HTMLInputTypeAttribute } from "react";
import FieldLabel from "./FieldLabel";

type InputFieldProps =
    {
        label: string;
        value: string;
        onChange:
        (
            value: string
        ) => void;
        placeholder?: string;
        type?: HTMLInputTypeAttribute;
        readOnly?: boolean;
        className?: string;
        required?: boolean
    };


export default function InputField
    (
        {
            label,
            value,
            onChange,
            placeholder,
            type = "text",
            readOnly = false,
            className = "",
            required = false,
        }: InputFieldProps
    ) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-medium text-[#12301D]">
                <FieldLabel label={label} required={required} />
            </label>

            <input
                type={type}
                value={value}
                onChange={
                    (e) => {
                        onChange(e.target.value);
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