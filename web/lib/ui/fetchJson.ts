export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T>
{
    const res = await fetch(url, {
        cache: "no-store",
        ...init,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || (json && json.ok === false)) {
        throw new Error(json?.error || `Request failed (${res.status})`);
    }

    return json as T;
}