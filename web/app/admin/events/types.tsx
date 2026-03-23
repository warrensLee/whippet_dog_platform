// @/admin/events/types.tsx
// What will be a result from a search? What does a user search for?
// This will be where we define parameters that will be used in searching and filtering!

export type EventSearchRequest = 
{
    q?: string;
    page?: number;
    limit?: number;
};

export type EventSearchResult = 
{
    meetNumber: string;
    clubAbbreviation: string;
    meetDate: string;
    raceSecretary: string;
    judge: string;
    location: string;
    yards: string;
};

export type EventFormValues = 
{
    meetNumber: string;
    clubAbbreviation: string;
    meetDate: string;
    raceSecretary: string;
    judge: string;
    location: string;
    yards: string;
};

export type EventListItem = 
{
    meetNumber: string;
    clubAbbreviation: string;
    meetDate: string;
    raceSecretary?: string;
    judge?: string;
    location: string;
    yards: string;
};

export type EventSearchResponse = 
{
    ok: boolean;
    data: EventListItem[];
};

export const emptyEventFormValues: EventFormValues = 
{
    meetNumber: "",
    clubAbbreviation: "",
    meetDate: "",
    raceSecretary: "",
    judge: "",
    location: "",
    yards: "",
};