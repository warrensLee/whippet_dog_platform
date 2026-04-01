export function formatDate(raw?: string | null): string | null
{
    if (!raw) return null;

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
        return raw;
    }

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}