export function formatDate(raw?: string | null): string | null {
    if (!raw) return null;

    const [day, month, year] = raw.split("-").map(Number);
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}