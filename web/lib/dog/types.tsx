export interface DogDetail {
  cwaNumber: string;
  registeredNumber?: string | null;
  foreignType?: string | null;
  callName?: string | null;
  registeredName: string;
  birthdate?: string | null;
  pedigreeLink?: string | null;
  status?: string | null;
  average?: number | string | null;
  currentGrade?: string | null;
  meetPoints?: number | null;
  arxPoints?: number | null;
  narxPoints?: number | null;
  showPoints?: number | null;
  dpcPoints?: number | null;
  adjustedMeetPoints?: number | null;
  adjustedArxPoints?: number | null;
  adjustedNarxPoints?: number | null;
  adjustedShowPoints?: number | null;
  adjustedDpcPoints?: number | null;
  manualMeetPointsAdjustment?: number | null;
  manualArxPointsAdjustment?: number | null;
  manualNarxPointsAdjustment?: number | null;
  manualShowPointsAdjustment?: number | null;
  manualDpcPointsAdjustment?: number | null;
  dpcLegs?: number | null;
  meetWins?: number | null;
  meetAppearences?: number | null;
  highCombinedWins?: number | null;
  publicNotes?: string | null;
  privateNotes?: string | null;
  dna?: string | null;
  sireDna?: string | null;
  damDna?: string | null;
  lastEditedBy?: string | number | null;
  lastEditedAt?: string | null;

  akcNumber?: string | null;
  ckcNumber?: string | null;
  foreignNumber?: string | null;
  ytdMatchPoints?: number | null;
  ytdYear?: number | null;
  kennelClubChampion?: boolean | null;
}

export interface MeetResult {
  meetPlacement?: number | null;
  meetPoints?: number | null;
  arxEarned?: number | null;
  narxEarned?: number | null;
  conformationPlacement?: number | null;
  matchPoints?: number | null;
  showPlacement?: number | null;
  showPoints?: number | null;
  dpcLeg?: number | null;
  dpcPoints?: number | null;
  hcScore?: number | null;
  hcLegEarned?: number | null;
  aomEarned?: number | null;
  [key: string]: unknown;
}

export interface RaceResult {
  program?: string | number;
  raceNumber?: string | number;
  placement?: number | null;
  meetPoints?: number | null;
  dpcPoints?: number | null;
  [key: string]: unknown;
}

export interface MeetEntry {
  MeetNumber: string | number;
  MeetDate?: string;
  ClubAbbreviation?: string;
  Location?: string;
  RaceSecretary?: string;
  Judge?: string;
  Completed?: boolean;
  EventMeetCount?: number;
  completed?: boolean;
  eventMeetCount?: number;
  meetResults?: MeetResult[];
  raceResults?: RaceResult[];
}

export interface DogOwner {
  userID: string;
  PersonID?: string | number;
  FirstName?: string;
  LastName?: string;
}

export type TierColor =
  | "gray"
  | "yellow"
  | "blue"
  | "purple"
  | "gold"
  | "teal"
  | "green";

export interface TitleTier {
  name: string;
  threshold: number;
  color: TierColor;
}

export interface TitleFamily {
  family: string;
  description: string;
  tiers: TitleTier[];
  getValue: (dog: DogDetail) => number;
  unit: string;
  extraCheck?: (dog: DogDetail) => string | null;
}

export interface RaceLineupEntry {
  cwaNumber: string;
  dogName: string;
  registeredName: string | null;
  placement: number | null;
  points: number | null;
}

export interface RaceLineup {
  meetNumber: string;
  program: string;
  raceNumber: string;
  entries: RaceLineupEntry[];
}

export type RaceLineupMap = Record<string, RaceLineup>;
