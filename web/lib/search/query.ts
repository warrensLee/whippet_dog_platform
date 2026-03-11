// @/lib/search/query.ts
import type { DogSearchRequest, DogSearchResponse } from "./types";


// clampInteger will fix the number between two values.
// It will be particulary useful for safeguarding
// the pagenumber and other integer values as needed
function clampInteger(num: number, min: number, max: number)
{
    if (!Number.isFinite(num))           // if number is not finite then clamp to the minimum value  
        return min;

    return Math.max(min, Math.min(max, Math.floor(num)));
}


// fixLength will make sure nobody pastes a book into the search
// or anything with a length greater than 64. 
function fixLength(q?: string)
{
    return (q ?? "").trim().slice(0, 64);
}


// this will normalize and make all searching parameters
// for dogs is correct and clean
function buildDogSearchParameters(request: DogSearchRequest)
{
    const q = fixLength(request.q);                                      // the query (text) in the search like "Rocket" when searching for a dog named rocket
    const pageNum = clampInteger(request.page ?? 1, 1, 10000);
    const limit = clampInteger(request.limit ?? 20, 1, 50);
    const sortMethod = request.sort ?? "relevance";                     // relevance by default if no sort method is selected

    const usp = new URLSearchParams();                                  // the URLSearchParams interface defines utility metPhods to work with the query string of a URL and is iterable
    usp.set("type", "dog");
    usp.set("q", q);
    usp.set("page", String(pageNum));
    usp.set("limit", String(limit));
    usp.set("sort", sortMethod);

    // now set datas with input options:

    if (typeof request.year === "number")
        usp.set("year", String(request.year));

    if (request.active)
        usp.set("active", request.active);

    return usp;
}


async function fetchJSON<T>(url: string): Promise<T> 
{
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok)
    {
        const text = await res.text().catch(() => "");
        throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
    }

    return res.json() as Promise<T>;
}


export async function searchDogs(request: DogSearchRequest): Promise<DogSearchResponse> 
{
    const usp = buildDogSearchParameters(request);

    // Node/server fetch needs an absolute URL. Browser fetch is fine with relative.
    const base =
        typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
        : "";

    const url = `${base}/api/search?${usp.toString()}`;
    return fetchJSON<DogSearchResponse>(url);
}