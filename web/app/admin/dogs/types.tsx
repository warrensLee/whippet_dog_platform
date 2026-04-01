// @/lib/search/type.ts
// What will be a result from a search? What does a user search for?
// This will be where we define parameters that will be used in searching and filtering!
// For filtering lets use sex, year, active, and title

export type DogSearchRequest = 
{
  q?: string;
  page?: number;
  limit?: number;
  sort?: "relevance" | "name_asc" | "name_desc" | "newest";
  year?: number;
  active?: string;
};

export type DogSearchResult = 
{
  id: string;
  name: string;
  regNo?: string;
  year?: number;
  ownerName?: string;
  title?: string;
  active: string;
};

export type DogFormValues = 
{
  cwaNumber: string;
  currentGrade: string;
  registeredNumber: string;
  foreignType: string;
  callName: string;
  registeredName: string;
  birthdate: string;
  pedigreeLink: string;
  status: string;
  publicNotes: string;
  privateNotes: string;
  dna: string;
  sireDna: string;
  damDna: string;

  meetPoints: string;
  arxPoints: string;
  narxPoints: string;
  showPoints: string;
  dpcLegs: string;
  meetWins: string;
  meetAppearences: string;
  highCombinedWins: string;
};

export type DogListItem = 
{
  id: string;
  cwaNumber: string;
  registeredNumber: string;
  registeredName: string;
  callName: string;
  birthYear: string;
  status: string;
  ownerName: string;
  title: string;
};

export type DogSearchResponse = 
{
  ok: boolean;
  total: number;
  items: DogListItem[];
};

export const emptyDogFormValues: DogFormValues = 
{
  cwaNumber: "",
  currentGrade: "",
  registeredNumber: "",
  foreignType: "",
  callName: "",
  registeredName: "",
  birthdate: "",
  pedigreeLink: "",
  status: "Active",
  publicNotes: "",
  privateNotes: "",
  dna: "",
  sireDna: "",
  damDna: "",

  meetPoints: "0",
  arxPoints: "0",
  narxPoints: "0",
  showPoints: "0",
  dpcLegs: "0",
  meetWins: "0",
  meetAppearences: "0",
  highCombinedWins: "0",
};