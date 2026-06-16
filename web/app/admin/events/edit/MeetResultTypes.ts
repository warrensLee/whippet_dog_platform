import { RaceEntry } from "../types";

export type DogRace = {
    program: string;
    race: string;
    box: number | undefined;
    placement: number;
    cwaNumber: string;
    incident: string | undefined;
};

export type DogEntry = {
    shown: boolean
    callName: string
    grade: string
    average: number
    cwaNumber: string
    registeredName: string
    showPoints: number
    entryType: "REG" | "PUPPY"
    showPlace: number
    dpcPoints: number
    NARXEarned: number
    ARXEarned: number
    hcWinner: boolean
    meetPlacement: number
    meetPoints: number
    aomEarned: string | number | null
    hcScore: number
    dpcLeg: boolean
    hcLegEarned: boolean
    birthdate: string
    arxPoints: number
    narxPoints: number
    dpcTitle: boolean



};

export type MeetResults = {
    races: Map<string, Map<string, DogRace[]>>
    entries: Map<string, DogEntry>
}

export type DogEntryResponse = {
    ok: true;
    races: Map<string, Map<string, DogRace[]>>;
    entries: Map<string, DogEntry>
};

export type ErroResponse = {
    ok: false;
    error: string;
};

export type MeetResultEditResponse = DogEntryResponse | ErroResponse;

export function recalculateMeetRankings(results: MeetResults): MeetResults {
    const entries = new Map(results.entries);

    if (entries.size === 0) return results

    function isIncidentDog(dog: DogEntry): boolean {
        for (const x of results.races.values()) {
            for (const y of x.values()) {
                for (const z of y) {
                    if (z.cwaNumber == dog.cwaNumber && z.incident) return true
                }
            }
        }
        return false
    }

    function getMeetPoints(dog: DogEntry): number {
        const v = Number(dog.meetPoints);
        return isNaN(v) ? 0 : v;
    }

    function getLastRacePlacement(dog: DogEntry): number {
        for (const raceMap of results.races.values()) {
            for (const raceArr of raceMap.values()) {
                for (const race of raceArr) {
                    if (race.cwaNumber === dog.cwaNumber && typeof race.placement === 'number') {
                        return race.placement;
                    }
                }
            }
        }
        return 999;
    }

    const ranked = Array.from(entries.values()).filter(d => !isIncidentDog(d));
    const incidents = Array.from(entries.values()).filter(d => isIncidentDog(d));

    ranked.sort((a, b) => {
        const pointsDiff = getMeetPoints(b) - getMeetPoints(a);
        if (pointsDiff !== 0) return pointsDiff;
        return getLastRacePlacement(a) - getLastRacePlacement(b);
    });

    for (let i = 0; i < ranked.length; i++) {
        const dog = entries.get(ranked[i].cwaNumber);
        if (dog) {
            dog.meetPlacement = i + 1;
        }
    }

    for (let i = 0; i < incidents.length; i++) {
        const dog = entries.get(incidents[i].cwaNumber);
        if (dog) {
            dog.meetPlacement = ranked.length + i + 1;
        }
    }

    return { races: results.races, entries };
}

const ADULT_AGE_MONTHS = 14;
const ARX_THRESHOLD = 15;

export function calculateArxNarx(meetResults: MeetResults): MeetResults {
    const entries = new Map(meetResults.entries);

    if (entries.size === 0) return meetResults;

    function hasIncident(dog: DogEntry): boolean {
        for (const raceMap of meetResults.races.values()) {
            for (const raceArr of raceMap.values()) {
                for (const race of raceArr) {
                    if (race.cwaNumber === dog.cwaNumber && race.incident && race.incident.trim() !== '') {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function completedAll4Programs(dog: DogEntry): boolean {
        const programs = new Set<string>();
        for (const raceMap of meetResults.races.values()) {
            for (const raceArr of raceMap.values()) {
                for (const race of raceArr) {
                    if (race.cwaNumber === dog.cwaNumber && race.program.trim()) {
                        programs.add(race.program.trim());
                    }
                }
            }
        }
        return programs.size >= 4;
    }

    const adultCount = Array.from(entries.values()).filter(d => d.entryType !== "PUPPY").length;
    const cutoff = Math.ceil(adultCount / 2);

    for (const dog of entries.values()) {
        const meetPlacement = dog.meetPlacement || 0;
        const adult = dog.entryType === "REG";
        const noIncidents = !hasIncident(dog);
        const all4Programs = completedAll4Programs(dog);
        const inTopHalf = adult && meetPlacement > 0 && meetPlacement <= cutoff;
        const eligible = adult && noIncidents && all4Programs && inTopHalf;

        if (dog.entryType === "PUPPY" || !adult) {
            dog.ARXEarned = 0;
            dog.NARXEarned = 0;
        } else {
            const hasArxTitle = dog.arxPoints >= ARX_THRESHOLD;
            dog.ARXEarned = (eligible && !hasArxTitle) ? 1 : 0;
            dog.NARXEarned = eligible ? 1 : 0;
        }
    }

    return { races: meetResults.races, entries };
}

export function validateRace(race: DogRace, allRaces?: DogRace[]): boolean {
    if (!allRaces) {
        return race.program.trim() !== "" &&
            race.race.trim() !== "" &&
            typeof race.placement === 'number' &&
            race.placement !== 0;
    }
    const raceIndex = allRaces.indexOf(race);
    const otherRaces = allRaces.filter((_, i) => i !== raceIndex);
    const hasDuplicate = otherRaces.some(otherRace =>
        otherRace.program === race.program && otherRace.race === race.race
    );
    if (hasDuplicate) {
        return false;
    }
    return race.program.trim() !== "" &&
        race.race.trim() !== "" &&
        typeof race.placement === 'number' &&
        race.placement !== 0;
}

export function getDpcPointDistribution(adultCount: number): number[] {
    if (adultCount >= 70) return [8, 6, 4, 2];
    if (adultCount >= 60) return [7, 5, 3, 1];
    if (adultCount >= 50) return [6, 4, 2, 1];
    if (adultCount >= 40) return [6, 4, 2];
    if (adultCount >= 30) return [5, 3, 1];
    if (adultCount >= 20) return [4, 2];
    if (adultCount >= 10) return [3, 1];
    return [];
}

export function calculateShowPoints(showPlace: number): number {
    if (!showPlace || showPlace < 1 || showPlace > 4) return 0;
    switch (showPlace) {
        case 1: return 5;
        case 2: return 3;
        case 3: return 2;
        case 4: return 1;
        default: return 0;
    }
}

export function calculateDpc(meetResults: MeetResults): MeetResults {
    const entries = new Map(meetResults.entries);

    if (entries.size === 0) return meetResults;

    function hasIncident(dog: DogEntry): boolean {
        for (const raceMap of meetResults.races.values()) {
            for (const raceArr of raceMap.values()) {
                for (const race of raceArr) {
                    if (race.cwaNumber === dog.cwaNumber && race.incident && race.incident.trim() !== '') {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    const adultCount = Array.from(entries.values()).filter(d => d.entryType !== "PUPPY").length;
    const distribution = getDpcPointDistribution(adultCount);

    for (const dog of entries.values()) {
        dog.dpcPoints = 0;
        dog.dpcLeg = false;
    }

    const sortedEntries = Array.from(entries.values()).sort((a, b) => a.meetPlacement - b.meetPlacement);

    let pointsIdx = 0;
    for (const dog of sortedEntries) {
        if (pointsIdx >= distribution.length) break;
        const dogHasIncident = hasIncident(dog);
        const isPuppy = dog.entryType === "PUPPY";
        const hasTitle = !!dog.dpcTitle;

        if (!dogHasIncident && !isPuppy && !hasTitle && dog.meetPlacement > 0) {
            dog.dpcPoints = distribution[pointsIdx];
            pointsIdx++;
        }
    }

    const shownResults = sortedEntries.filter(d => d.shown && d.showPlace > 0);
    shownResults.sort((a, b) => a.showPlace - b.showPlace);

    const cutoff = adultCount > 0 ? Math.ceil(adultCount / 2) : 0;

    for (const dog of shownResults) {
        const conPlace = dog.showPlace;
        const inTopHalf = conPlace <= cutoff;
        const dogHasIncident = hasIncident(dog);
        const isPuppy = dog.entryType === "PUPPY";
        const hasTitle = !!dog.dpcTitle;
        const hasLegOrPoints = dog.dpcLeg || dog.dpcPoints > 0;

        if (inTopHalf && !dogHasIncident && !isPuppy && !hasTitle && !hasLegOrPoints) {
            dog.dpcLeg = true;
            break;
        }
    }

    return { races: meetResults.races, entries };
}