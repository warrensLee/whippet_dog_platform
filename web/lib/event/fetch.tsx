export async function fetchMeetRaces(meetNumber: string) {
    const res = await fetch(`/api/meet/get/${encodeURIComponent(meetNumber)}/races`, {
        credentials: "include",
        cache: "no-store",
    });

    return res.json();
}

export async function fetchRaceEntries(meetNumber: string, program: string, raceNumber: string) {
    const res = await fetch(
        `/api/race_result/by_race/${encodeURIComponent(meetNumber)}/${encodeURIComponent(program)}/${encodeURIComponent(raceNumber)}`,
        {
            credentials: "include",
            cache: "no-store",
        }
    );

    return res.json();
}

export async function fetchMeetResults(meetNumber: string) {
    const res = await fetch(`/api/meet_result/by_meet/${encodeURIComponent(meetNumber)}`, {
        credentials: "include",
        cache: "no-store",
    });

    return res.json();
}