// @/admin/events/types.tsx
// What will be a result from a search? What does a user search for?
// This will be where we define parameters that will be used in searching and filtering!

import { PersonSearchResult } from "@/app/components/ui/PersonField";


export type EventSearchRequest = {
    q?: string;
    page?: number;
    limit?: number;
};

export type EventSearchResult = {
    meetNumber: string;
    clubAbbreviation: string;
    meetDate: string;
    raceSecretary?: string;
    raceSecretaryName?: string;
    judge?: string;
    judgeName?: string;
    location: string;
    yards: string;
    publicNotes?: string;
    privateNotes?: string;
};

export type EventFormValues = {
    meetNumber: string;
    clubAbbreviation: string;
    meetDate: string;
    raceSecretary: PersonSearchResult | null | undefined;
    judge: PersonSearchResult | null | undefined;
    location: string;
    yards: string;
    publicNotes: string;
    privateNotes: string;
};

export type EventListItem = {
    meetNumber: string;
    clubAbbreviation: string;
    meetDate: string;
    raceSecretaryId?: string;
    raceSecretaryName?: string;
    judgeId?: string;
    judgeName?: string;
    location: string;
    yards: string;
    publicNotes?: string;
    privateNotes?: string;
};

export type EventSearchResponse = {
    ok: boolean;
    data: EventListItem[];
};

export const emptyEventFormValues: EventFormValues = {
    meetNumber: "",
    clubAbbreviation: "",
    meetDate: "",
    raceSecretary: null,
    judge: null,
    location: "",
    yards: "",
    publicNotes: "",
    privateNotes: "",
};

export type MeetSearchResult = {
    id: string;
    meetNumber: string;
    clubAbbreviation: string;
    meetDate: string;
    raceSecretaryId?: string;
    raceSecretaryName?: string;
    judgeId?: string;
    judgeName?: string;
    location: string;
    yards: string;
    publicNotes: string;
};

export type MeetSearchResponse = {
    ok: boolean;
    total: number;
    items: MeetSearchResult[];
};

export type MeetRaceSummary = {
    meetNumber: string;
    program: string;
    raceNumber: string;
    entryCount: number;
};

export type RaceEntry = {
    cwaNumber: string;
    dogName: string;
    registeredName?: string;
    callName?: string;
    placement: string;
    meetPoints: string | number;
    aomEarned?: string | number;
    dpcPoints?: string | number;
};

export type EditableRaceEntry = {
    meetNumber: string;
    program: string;
    raceNumber: string;
    cwaNumber: string;
    entryType: string;
    box: string;
    placement: string;
    incident: string;
    meetPoints?: string | number;
    aomEarned?: string | number;
    dpcPoints?: string | number;
    dogName?: string;
};

export type MeetResultRow = {
    meetNumber: string;
    cwaNumber: string;
    average: string;
    grade: string;
    meetPlacement: string;
    conformationPlacement: string;
    matchPoints: string;
    meetPoints: string;
    arxEarned: string;
    narxEarned: string;
    shown: string;
    showPlacement: string;
    showPoints: string;
    dpcLeg: string;
    hcScore: string;
    hcLegEarned: string;
    aomEarned: string;
    dpcPoints: string;
};