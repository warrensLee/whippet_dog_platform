export default function FieldLabel({ label, required = false }: { label: string, required: boolean }) {

    return (
        <>
            {label}
            {required && <span className="text-red-600 font-bold"> *</span>}
        </>
    );
}