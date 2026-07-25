export interface FinalMeetResult {
    cwaNumber: string;
    place?: number | null;
    grade?: string | null;
    callName?: string | null;
    registeredName?: string | null;
    ownerName?: string | null;
    ownerIDs?: string | null;
    meetPoints?: number | null;
    scratchDQInfo?: string | null;
    arxEarned?: number;
    narxEarned?: number;
    incident?: string;
    hcScore?: number;
    dpcPoints?: number;
    entryType?: string;
    matchPoints?: number;
    shown?: boolean
    HCLegEarned?: boolean
    showPoints?: number
    showPlacement?: string
}

export interface EventDetail {
    meetNumber: string;
    meetDate?: string;
    clubAbbreviation?: string;
    raceSecretary?: string;
    judge?: string;
    location?: string;
    yards?: string | number;
    completed?: boolean;
    eventMeetCount?: number;
    requestFormLink?: string;
    resultsLink?: string;
    publicNotes?: string;
    privateNotes?: string;
}

export interface MeetRace {
    meetNumber: string;
    raceNumber: string | number;
    displayRaceNumber?: number;
    program?: string;
    entryCount?: number;
}


export interface DisplayProgram {
    program: string;
    races: MeetRace[];
}

export interface RaceLineupEntry {
    cwaNumber: string;
    dogName: string;
    registeredName: string | null;
    placement: number | null;
    meetPoints: number | null;
    aomEarned: number | null;
    dpcPoints: number | null;
};

export interface RaceLineupDetail {
    meetNumber: string;
    program: string;
    raceNumber: string;
    entries: RaceLineupEntry[];
};

export interface BaseRace {
    raceNumber: string | number;
    displayRaceNumber?: number;
    program?: string;
    entryCount?: number;
};