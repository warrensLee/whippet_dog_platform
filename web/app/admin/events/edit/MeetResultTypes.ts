export type DogRace = {
    program: string;
    race: string;
    box: number | undefined;
    placement: number | "AOM" | undefined;
    cwaNumber: string;
    incident: string | undefined;
};

export type DogEntry = {
    shown: boolean;
    callName: string;
    grade: string;
    average: number;
    cwaNumber: string;
    registeredName: string;
    showPoints: string;
    entryType: "REG" | "PUPPY";
    showPlace: string;
    dpcPoints: string;
    NARXEarned: string;
    ARXEarned: string;
    hcLegEarned: boolean;
    meetPlacement: string;
    meetPoints: string;
    aomEarned: string | number | null;
    hcScore: string;
    dpcLeg: boolean;
    birthdate: string;
    arxPoints: string;
    narxPoints: string;
    dpcTitle: boolean;
    races: DogRace[];
};

export type BackendMeetResultResponse = {
    ok: boolean;
    dogs: Omit<DogEntry, "races">[];
    races: Record<string, Record<string, Array<{
        dog: string;
        box: string;
        placement: string;
        incident: string;
    }>>>;
};

export type RaceDefinition = {
    program: string;
    race: string;
};

export type MeetResults = DogEntry[];

export type BackendEntry = {
    cwaNumber: string;
    shown: boolean;
    showPoints: number;
    showPlace: string;
    grade: string;
    average: number;
    dpcPoints: number;
    ARXEarned: number;
    NARXEarned: number;
    hcWinner: number;
    entryType: "REG" | "PUPPY";
    meetPlacement: number | string;
    meetPoints: number | string;
    dpcLeg: string;
    races: Array<{
        program: string;
        race: string;
        box: string | undefined;
        placement: string | undefined;
        incident: string | undefined;
    }>;
};

export function toBackendFormat(entries: MeetResults): BackendEntry[] {
    return entries.map(dog => ({
        cwaNumber: dog.cwaNumber,
        shown: dog.shown,
        showPoints: parseFloat(dog.showPoints) || 0,
        showPlace: dog.showPlace || "0",
        grade: dog.grade,
        average: dog.average || 0,
        dpcPoints: dog.dpcPoints ? parseInt(dog.dpcPoints) || 0 : 0,
        ARXEarned: dog.ARXEarned ? parseInt(dog.ARXEarned) || 0 : 0,
        NARXEarned: dog.NARXEarned ? parseInt(dog.NARXEarned) || 0 : 0,
        hcWinner: dog.hcLegEarned ? 1 : 0,
        entryType: dog.entryType,
        meetPlacement: dog.meetPlacement === "AOM" ? "AOM" : (dog.meetPlacement ? parseInt(dog.meetPlacement) || 0 : 0),
        meetPoints: dog.meetPoints || 0,
        dpcLeg: dog.dpcLeg ? "1" : "0",
        aomEarned: dog.aomEarned,
        races: dog.races.map(race => ({
            program: race.program,
            race: race.race,
            box: race.box?.toString() || "",
            placement: typeof race.placement === "number" ? String(race.placement) : race.placement === "AOM" ? "AOM" : "0",
            incident: race.incident || "",
        })),
    }));
}

export function buildDogEntry(base: Omit<DogEntry, "races">, races: DogRace[]): DogEntry {
    return {
        ...base,
        races,
        showPoints: base.showPoints ?? String(calculateShowPoints(base.showPlace)),
    };
}

export function groupByProgram(results: MeetResults): Map<string, DogRace[]> {
    const programRaces = new Map<string, DogRace[]>();
    for (const dog of results) {
        for (const race of dog.races) {
            if (!programRaces.has(race.program)) {
                programRaces.set(race.program, []);
            }
            const existing = programRaces.get(race.program)!;
            if (!existing.some(r => r.race === race.race && r.cwaNumber === race.cwaNumber)) {
                existing.push(race);
            }
        }
    }
    return programRaces;
}

export function getRacesForProgram(results: MeetResults, program: string): Map<string, DogRace[]> {
    const racesByNumber = new Map<string, DogRace[]>();
    for (const dog of results) {
        for (const race of dog.races) {
            if (race.program !== program) continue;
            if (!racesByNumber.has(race.race)) {
                racesByNumber.set(race.race, []);
            }
            racesByNumber.get(race.race)!.push(race);
        }
    }
    return racesByNumber;
}

export function getDefinedRacesForProgram(defined: RaceDefinition[], program: string): string[] {
    return Array.from(new Set(
        defined.filter(d => d.program === program).map(d => d.race)
    )).sort((a, b) => parseInt(a) - parseInt(b));
}

export function addRaceDefinition(defined: RaceDefinition[], program: string, race: string): RaceDefinition[] {
    const exists = defined.some(d => d.program === program && d.race === race);
    if (exists) return defined;
    return [...defined, { program, race }];
}

export function removeRaceDefinition(defined: RaceDefinition[], program: string, race: string): RaceDefinition[] {
    return defined.filter(d => !(d.program === program && d.race === race));
}

export function removeProgramFromDefinitions(defined: RaceDefinition[], program: string): RaceDefinition[] {
    return defined.filter(d => d.program !== program);
}

export function renumberRacesInProgram(results: MeetResults, program: string, definedRaces: RaceDefinition[]): MeetResults {
    const raceNumbers = getDefinedRacesForProgram(definedRaces, program);
    const raceToNewNumber = new Map<string, string>();
    for (let i = 0; i < raceNumbers.length; i++) {
        raceToNewNumber.set(raceNumbers[i], String(i + 1));
    }

    return results.map(dog => {
        const dogRaces = dog.races.filter(r => r.program === program);
        if (dogRaces.length === 0) return dog;

        const newRaces = dog.races.filter(r => !(r.program === program)).concat(
            dogRaces
                .map(r => {
                    const newNum = raceToNewNumber.get(r.race);
                    if (newNum) {
                        return { ...r, race: newNum };
                    }
                    return null;
                })
                .filter((r): r is DogRace => r !== null)
        );

        return { ...dog, races: newRaces };
    });
}

export function renumberPrograms(results: MeetResults, definedPrograms: string[]): { results: MeetResults; definedPrograms: string[] } {
    if (definedPrograms.length < 2) return { results, definedPrograms };

    const newPrograms = [...definedPrograms].sort((a, b) => parseInt(a) - parseInt(b));

    const programMap = new Map<string, string>();
    for (let i = 0; i < newPrograms.length; i++) {
        programMap.set(newPrograms[i], String(i + 1));
    }

    const updatedPrograms = newPrograms.map((_, i) => String(i + 1));

    const updated = results.map(dog => {
        const newRaces = dog.races.map(race => {
            const newProgram = programMap.get(race.program);
            if (newProgram) {
                return { ...race, program: newProgram };
            }
            return race;
        });
        return { ...dog, races: newRaces };
    });

    return { results: updated, definedPrograms: updatedPrograms };
}

export function removeRaceAndRenumber(results: MeetResults, program: string, raceNumber: string, definedRaces: RaceDefinition[]): { results: MeetResults; definedRaces: RaceDefinition[] } {
    // Build new definitions: remove deleted race
    const newDefinedRaces = definedRaces.filter(d => !(d.program === program && d.race === raceNumber));

    // Collect ALL remaining race numbers from both defined races and dog data
    const definedNumbers = getDefinedRacesForProgram(newDefinedRaces, program);
    const dataRaceNumbers = new Set<string>();
    for (const dog of results) {
        for (const r of dog.races) {
            if (r.program === program && r.race !== raceNumber) {
                dataRaceNumbers.add(r.race);
            }
        }
    }
    const allRemaining = [...new Set([...definedNumbers, ...dataRaceNumbers])].sort((a, b) => parseInt(a) - parseInt(b));

    const raceToNewNumber = new Map<string, string>();
    const newDefinedRacesRenumbered: RaceDefinition[] = [];
    for (let i = 0; i < allRemaining.length; i++) {
        raceToNewNumber.set(allRemaining[i], String(i + 1));
        newDefinedRacesRenumbered.push({ program, race: String(i + 1) });
    }

    const updated = results.map(dog => {
        const programRaces = dog.races.filter(r => r.program === program && r.race !== raceNumber);
        if (programRaces.length === 0) return dog;

        const newRaces = dog.races.filter(r => !(r.program === program)).concat(
            programRaces.map(r => ({ ...r, race: raceToNewNumber.get(r.race) ?? r.race }))
        );

        return { ...dog, races: newRaces };
    });

    return { results: updated, definedRaces: newDefinedRacesRenumbered };
}

export function removeProgramAndRenumber(results: MeetResults, programToRemove: string, definedRaces: RaceDefinition[], definedPrograms: string[]): { results: MeetResults; definedRaces: RaceDefinition[]; definedPrograms: string[] } {
    const newDefinedRaces = removeProgramFromDefinitions(definedRaces, programToRemove);
    const newDefinedPrograms = definedPrograms.filter(p => p !== programToRemove).sort((a, b) => parseInt(a) - parseInt(b));

    // Remove orphaned races from the deleted program
    const cleanedResults = results.map(dog => ({
        ...dog,
        races: dog.races.filter(r => r.program !== programToRemove),
    }));

    // Build program number mapping
    const programMap = new Map<string, string>();
    for (let i = 0; i < newDefinedPrograms.length; i++) {
        programMap.set(newDefinedPrograms[i], String(i + 1));
    }
    const updatedPrograms = newDefinedPrograms.map((_, i) => String(i + 1));

    // Update dog races
    const updatedResults = cleanedResults.map(dog => ({
        ...dog,
        races: dog.races.map(race => {
            const newProgram = programMap.get(race.program);
            if (newProgram) {
                return { ...race, program: newProgram };
            }
            return race;
        }),
    }));

    // Update definedRaces with new program numbers
    const updatedDefinedRaces = newDefinedRaces.map(r => {
        const newProgram = programMap.get(r.program);
        if (newProgram) {
            return { ...r, program: newProgram };
        }
        return r;
    });

    return { results: updatedResults, definedRaces: updatedDefinedRaces, definedPrograms: updatedPrograms };
}

export function getDogsInRace(results: MeetResults, program: string, raceNumber: string): DogEntry[] {
    const dogs: DogEntry[] = [];
    for (const dog of results) {
        const hasRace = dog.races.some(r => r.program === program && r.race === raceNumber);
        if (hasRace) {
            dogs.push(dog);
        }
    }
    return dogs;
}

export function getDogRace(dog: DogEntry, program: string, raceNumber: string): DogRace | undefined {
    return dog.races.find(r => r.program === program && r.race === raceNumber);
}

export function recalculateMeetRankings(results: MeetResults): MeetResults {
    const entries = [...results];

    if (entries.length === 0) return results;

    function isIncidentDog(cwaNumber: string): boolean {
        for (const dog of results) {
            for (const race of dog.races) {
                if (race.cwaNumber === cwaNumber && race.incident && race.incident.trim() !== "") return true;
            }
        }
        return false;
    }

    function getMeetPoints(cwaNumber: string): number {
        const dog = entries.find(d => d.cwaNumber === cwaNumber);
        const v = dog ? Number(dog.meetPoints) : 0;
        return isNaN(v) ? 0 : v;
    }

    function getLastRacePlacement(cwaNumber: string): number {
        for (const dog of results) {
            for (const race of dog.races) {
                if (race.cwaNumber === cwaNumber && typeof race.placement === "number" && race.placement > 0) {
                    return race.placement;
                }
            }
        }
        return 999;
    }

    const ranked = entries.filter(d => !isIncidentDog(d.cwaNumber));
    const incidents = entries.filter(d => isIncidentDog(d.cwaNumber));

    ranked.sort((a, b) => {
        const pointsDiff = getMeetPoints(b.cwaNumber) - getMeetPoints(a.cwaNumber);
        if (pointsDiff !== 0) return pointsDiff;
        return getLastRacePlacement(a.cwaNumber) - getLastRacePlacement(b.cwaNumber);
    });

    const updated = [...entries];
    for (let i = 0; i < ranked.length; i++) {
        const idx = updated.findIndex(d => d.cwaNumber === ranked[i].cwaNumber);
        if (idx >= 0) {
            updated[idx] = { ...updated[idx], meetPlacement: String(i + 1) };
        }
    }

    for (let i = 0; i < incidents.length; i++) {
        const idx = updated.findIndex(d => d.cwaNumber === incidents[i].cwaNumber);
        if (idx >= 0) {
            updated[idx] = { ...updated[idx], meetPlacement: String(ranked.length + i + 1) };
        }
    }

    return updated;
}

const ARX_THRESHOLD = 15;

export function calculateArxNarx(results: MeetResults): MeetResults {
    if (results.length === 0) return results;

    function hasIncident(cwaNumber: string): boolean {
        for (const dog of results) {
            for (const race of dog.races) {
                if (race.cwaNumber === cwaNumber && race.incident && race.incident.trim() !== "") {
                    return true;
                }
            }
        }
        return false;
    }

    function completedAll4Programs(cwaNumber: string): boolean {
        const programs = new Set<string>();
        for (const dog of results) {
            for (const race of dog.races) {
                if (race.cwaNumber === cwaNumber && race.program.trim()) {
                    programs.add(race.program.trim());
                }
            }
        }
        return programs.size >= 4;
    }

    const adultCount = results.filter(d => d.entryType !== "PUPPY").length;
    const cutoff = Math.ceil(adultCount / 2);

    const updated = results.map(dog => {
        const meetPlacement = parseInt(dog.meetPlacement || "0");
        const adult = dog.entryType === "REG";
        const noIncidents = !hasIncident(dog.cwaNumber);
        const all4Programs = completedAll4Programs(dog.cwaNumber);
        const inTopHalf = adult && meetPlacement > 0 && meetPlacement <= cutoff;
        const eligible = adult && noIncidents && all4Programs && inTopHalf;
        const hasArxTitle = parseInt(dog.arxPoints || "0") >= ARX_THRESHOLD;

        let ARXEarned = 0;
        let NARXEarned = 0;

        if (dog.entryType === "PUPPY" || !adult) {
            ARXEarned = 0;
            NARXEarned = 0;
        } else {
            ARXEarned = (eligible && !hasArxTitle) ? 1 : 0;
            NARXEarned = eligible ? 1 : 0;
        }

        return {
            ...dog,
            ARXEarned: String(ARXEarned),
            NARXEarned: String(NARXEarned),
        };
    });

    return updated;
}

export function validateRace(race: DogRace, allRaces?: DogRace[]): boolean {
    if (!allRaces) {
        return race.program.trim() !== "" &&
            race.race.trim() !== "" &&
            typeof race.placement === "number" &&
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
        typeof race.placement === "number" &&
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

export function calculateShowPoints(showPlace: string): number {
    switch (showPlace) {
        case "1": return 5;
        case "2": return 3;
        case "3": return 2;
        case "4": return 1;
        case "AOM1": return 0.5;
        case "AOM2": return 0.5;
        case "AOM3": return 0.5;
        default: return 0;
    }
}

export function calculateDpc(results: MeetResults): MeetResults {
    if (results.length === 0) return results;

    function hasIncident(cwaNumber: string): boolean {
        for (const dog of results) {
            for (const race of dog.races) {
                if (race.cwaNumber === cwaNumber && race.incident && race.incident.trim() !== "") {
                    return true;
                }
            }
        }
        return false;
    }

    const adultCount = results.filter(d => d.entryType !== "PUPPY").length;
    const distribution = getDpcPointDistribution(adultCount);

    const updated = results.map(dog => ({
        ...dog,
        dpcPoints: "0",
    }));

    const sorted = [...updated].sort((a, b) => parseInt(a.meetPlacement || "999") - parseInt(b.meetPlacement || "999"));
    const shownResults = sorted.filter(d => d.shown && d.showPlace);
    shownResults.sort((a, b) => (parseInt(a.showPlace) || Infinity) - (parseInt(b.showPlace) || Infinity));

    let pointsIdx = 0;
    for (const dog of shownResults) {
        if (pointsIdx >= distribution.length) break;
        const dogHasIncident = hasIncident(dog.cwaNumber);
        const isPuppy = dog.entryType === "PUPPY";
        const hasTitle = dog.dpcTitle;

        if (dog.shown && !dogHasIncident && !isPuppy && !hasTitle && parseInt(dog.meetPlacement || "0") > 0) {
            const idx = updated.findIndex(d => d.cwaNumber === dog.cwaNumber);
            if (idx >= 0) {
                updated[idx] = { ...updated[idx], dpcPoints: String(distribution[pointsIdx]) };
            }
            pointsIdx++;
        }
    }

    return updated;
}

export function calculateMeetPoints(results: MeetResults): MeetResults {
    function getPlacementPoints(placement: number): number {
        switch (placement) {
            case 1: return 5;
            case 2: return 3;
            case 3: return 2;
            case 4: return 1;
            default: return 0;
        }
    }

    return results.map(dog => {
        let total = 0;
        for (const race of dog.races) {
            if (race.incident && race.incident.trim() !== "") continue;
            if (race.placement === "AOM") {
                total += 0.5;
            } else if (typeof race.placement === "number") {
                if (race.placement === 5) {
                    total += 0.5;
                } else {
                    total += getPlacementPoints(race.placement);
                }
            }
        }
        return { ...dog, meetPoints: String(total) };
    });
}

export function calculateHcWinner(results: MeetResults): MeetResults {
    let bestDog = "";
    let bestScore = -1;

    for (const dog of results) {
        const hasIncident = dog.races.some(r => r.incident && r.incident.trim() !== "");
        const hasAnyPlacement = dog.races.some(r => (typeof r.placement === "number" && r.placement > 0 && r.placement <= 4) || r.placement === "AOM");

        if (!hasIncident && hasAnyPlacement && dog.entryType === "REG") {
            const meetPts = parseFloat(dog.meetPoints || "0");
            const showPts = parseFloat(dog.showPoints || "0");
            const totalScore = meetPts + showPts;
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestDog = dog.cwaNumber;
            }
        }
    }

    return results.map(dog => ({
        ...dog,
        hcLegEarned: dog.cwaNumber === bestDog,
    }));
}

export function calculateAom(results: MeetResults): MeetResults {
    return results.map(dog => {
        let total = 0;
        for (const race of dog.races) {
            if (race.incident && race.incident.trim() !== "") continue;
            if (race.placement === "AOM") {
                total += 0.5;
            }
        }
        return { ...dog, aomEarned: total };
    });
}

export function recalculateAll(results: MeetResults): MeetResults {
    let updated = results.map(dog => {
        if (dog.shown && dog.showPlace) {
            return { ...dog, showPoints: String(calculateShowPoints(dog.showPlace)) };
        }
        return dog;
    });

    updated = calculateMeetPoints(updated);
    updated = recalculateMeetRankings(updated);
    updated = calculateAom(updated);
    updated = calculateArxNarx(updated);
    updated = calculateDpc(updated);
    updated = calculateHcWinner(updated);
    return updated;
}
