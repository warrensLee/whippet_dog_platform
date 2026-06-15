
export class DogRace {
    program: string = "";
    race: string = "";
    box: string | undefined = "";
    placement: string = "";
    incident: string = "";



};

export class DogEntry {
    shown: boolean = false;
    callName: string = "";
    grade: string = "";
    average: number = 0;
    cwaNumber: string = "";
    registeredName: string = "";
    showPoints: string = "";
    entryType: string = "";
    showPlace: string = "";
    races: DogRace[] = [];
    dpcPoints: string = "";
    NARXEarned: string = "";
    ARXEarned: string = "";
    hcWinner: boolean = false;
    meetPlacement: string = "";
    meetPoints: string = "";
    aomEarned: string | number | null = null;
    hcScore: string = "";
    dpcLeg: string = "";
    hcLegEarned: string = "";
    birthdate: string = "";
    arxPoints: string = "";
    narxPoints: string = "";
    dpcTitle: boolean = false;



};

export type MeetResults = DogEntry[];

export type DogEntryResponse = {
    ok: true;
    entries: MeetResults;
};

export type ErroResponse = {
    ok: false;
    error: string;
};

export type MeetResultEditResponse = DogEntryResponse | ErroResponse;

export function recalculateMeetRankings(dogs: DogEntry[]): DogEntry[] {
    if (dogs.length === 0) return dogs;

    function isIncidentDog(dog: DogEntry): boolean {
        return dog.races.some(r => r.incident && r.incident.trim() !== '');
    }

    function getMeetPoints(dog: DogEntry): number {
        const v = Number(dog.meetPoints);
        return isNaN(v) ? 0 : v;
    }

    function getLastRacePlacement(dog: DogEntry): number {
        for (let i = dog.races.length - 1; i >= 0; i--) {
            const p = dog.races[i].placement;
            if (p && /^\d+$/.test(p)) return Number(p);
        }
        return 999;
    }

    const ranked = dogs.filter(d => !isIncidentDog(d));
    const incidents = dogs.filter(d => isIncidentDog(d));

    ranked.sort((a, b) => {
        const pointsDiff = getMeetPoints(b) - getMeetPoints(a);
        if (pointsDiff !== 0) return pointsDiff;
        return getLastRacePlacement(a) - getLastRacePlacement(b);
    });

    const result = dogs.map(d => ({ ...d, meetPlacement: d.meetPlacement }));

    for (let i = 0; i < ranked.length; i++) {
        const idx = result.findIndex(d => d.cwaNumber === ranked[i].cwaNumber);
        if (idx !== -1) {
            result[idx] = { ...result[idx], meetPlacement: String(i + 1) };
        }
    }

    for (let i = 0; i < incidents.length; i++) {
        const idx = result.findIndex(d => d.cwaNumber === incidents[i].cwaNumber);
        if (idx !== -1) {
            result[idx] = { ...result[idx], meetPlacement: String(ranked.length + i + 1) };
        }
    }

    return result;
}

const ADULT_AGE_MONTHS = 14;
const ARX_THRESHOLD = 15;

function isDogAdult(birthdate: string): boolean {
    if (!birthdate) return false;
    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return false;
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    return ageInMonths >= ADULT_AGE_MONTHS;
}

function hasIncident(dog: DogEntry): boolean {
    return dog.races.some(r => r.incident && r.incident.trim() !== '');
}

function completedAll4Programs(dog: DogEntry): boolean {
    const programs = new Set<string>();
    for (const race of dog.races) {
        if (race.program.trim()) {
            programs.add(race.program.trim());
        }
    }
    return programs.size >= 4;
}

function countAdultDogs(dogs: DogEntry[]): number {
    return dogs.filter(d => d.entryType !== "PUPPY").length;
}

export function calculateArxNarx(dogs: DogEntry[]): DogEntry[] {
    if (dogs.length === 0) return dogs;

    const adultCount = countAdultDogs(dogs);
    const cutoff = Math.ceil(adultCount / 2);

    const result = dogs.map(d => ({ ...d }));

    for (const dog of result) {
        const meetPlacement = Number(dog.meetPlacement) || 0;
        const adult = dog.entryType == "REG"
        const noIncidents = !hasIncident(dog);
        const all4Programs = completedAll4Programs(dog);
        const inTopHalf = adult && meetPlacement > 0 && meetPlacement <= cutoff;
        const eligible = adult && noIncidents && all4Programs && inTopHalf;

        if (dog.entryType === "PUPPY" || !adult) {
            dog.ARXEarned = "0";
            dog.NARXEarned = "0";
        } else {
            const hasArxTitle = +dog.arxPoints >= ARX_THRESHOLD;
            dog.ARXEarned = (eligible && !hasArxTitle) ? "1" : "0";
            dog.NARXEarned = eligible ? "1" : "0";
        }
    }

    return result;
}

export function validateRace(race: DogRace, allRaces?: DogRace[]): boolean {
    if (!allRaces) {
        return race.program.trim() !== "" &&
            race.race.trim() !== "" &&
            race.placement !== "" &&
            Number(race.placement) !== 0;
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
        race.placement !== "" &&
        Number(race.placement) !== 0;
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

export function calculateShowPoints(showPlace: string): string {
    if (!showPlace || !/^\d+$/.test(showPlace)) return "";
    switch (showPlace) {
        case "1": return "5";
        case "2": return "3";
        case "3": return "2";
        case "4": return "1";
        default: return "0";
    }
}

export function calculateDpc(dogs: DogEntry[]): DogEntry[] {
    if (dogs.length === 0) return dogs;

    const adultCount = countAdultDogs(dogs);
    const distribution = getDpcPointDistribution(adultCount);

    const result = dogs.map(d => ({ ...d, dpcPoints: "0", dpcLeg: "" }));

    result.sort((a, b) => Number(a.meetPlacement) - Number(b.meetPlacement));

    let pointsIdx = 0;
    for (const dog of result) {
        if (pointsIdx >= distribution.length) break;
        const hasIncidentDog = hasIncident(dog);
        const isPuppy = dog.entryType === "PUPPY";
        const hasTitle = dog.dpcTitle || false;

        if (!hasIncidentDog && !isPuppy && !hasTitle && Number(dog.meetPlacement) > 0) {
            dog.dpcPoints = String(distribution[pointsIdx]);
            pointsIdx++;
        }
    }

    const shownResults = result.filter(d => d.shown && d.showPlace && /^\d+$/.test(d.showPlace));
    shownResults.sort((a, b) => Number(a.showPlace) - Number(b.showPlace));

    const cutoff = adultCount > 0 ? Math.ceil(adultCount / 2) : 0;

    for (const dog of shownResults) {
        const conPlace = Number(dog.showPlace);
        const inTopHalf = conPlace <= cutoff;
        const dogHasIncident = hasIncident(dog);
        const isPuppy = dog.entryType === "PUPPY";
        const hasTitle = dog.dpcTitle || false;
        const hasLegOrPoints = dog.dpcLeg === "1" || Number(dog.dpcPoints) > 0;

        if (inTopHalf && !dogHasIncident && !isPuppy && !hasTitle && !hasLegOrPoints) {
            dog.dpcLeg = "1";
            break;
        }
    }

    return result;
}