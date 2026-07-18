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