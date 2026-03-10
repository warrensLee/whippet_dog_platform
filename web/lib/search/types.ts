// @/lib/search/type.ts
// What will be a result from a search? What does a user search for?
// This will be where we define parameters that will be used in searching and filtering!
// For filtering lets use sex, year, active, and title 

                            

export type DogFormValues = {
  cwaNumber: string;
  akcNumber: string;
  ckcNumber: string;
  currentGrade: string;
  foreignNumber: string;
  foreignType: string;
  callName: string;
  registeredName: string;
  birthdate: string;
  pedigreeLink: string;
  status: string;
  notes: string;
};

export type DogListItem = {
  id: string;
  cwaNumber: string;
  registeredName: string;
  callName: string;
  birthYear: string;
  status: string;
  ownerName: string;
  title: string;
};

export type DogSearchResponse = {
  ok: boolean;
  total: number;
  items: DogListItem[];
};

export const emptyDogFormValues: DogFormValues = {
  cwaNumber: "",
  akcNumber: "",
  ckcNumber: "",
  currentGrade: "",
  foreignNumber: "",
  foreignType: "",
  callName: "",
  registeredName: "",
  birthdate: "",
  pedigreeLink: "",
  status: "ACTIVE",
  notes: "",
};