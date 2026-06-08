export function formatDate(raw?: string | null): string | null
{
    if (!raw) return null;

    const date = new Date(raw + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return raw;
    }

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}