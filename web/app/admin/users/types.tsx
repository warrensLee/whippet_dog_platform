export type UserRole = {
  id: number | string;
  title: string;
  editDogScope: number;
  editPersonScope: number;
  editDogOwnerScope: number;
  editUserRoleScope: number;
  editMeetScope: number;
  editMeetResultsScope: number;
  editRaceResultsScope: number;
  editDogTitlesScope: number;
  editTitleTypeScope: number;
  editDatabaseScope: number;
  lastEditedBy?: string | null;
  lastEditedAt?: string | null;
};

export type Person = {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  addressLineOne?: string | null;
  addressLineTwo?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  zipCode?: string | null;
  country?: string | null;
  primaryPhone?: string | null;
  secondaryPhone?: string | null;
  systemRole: string;
  notes?: string | null;
  lastEditedBy?: string | null;
  lastEditedAt?: string | null;
};

export type EditForm = {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  addressLineOne: string;
  addressLineTwo: string;
  city: string;
  stateProvince: string;
  zipCode: string;
  country: string;
  primaryPhone: string;
  secondaryPhone: string;
  systemRole: string;
  notes: string;
};

export type AddForm = {
  firstName: string;
  lastName: string;
  email: string;
  addressLineOne: string;
  addressLineTwo: string;
  city: string;
  stateProvince: string;
  zipCode: string;
  country: string;
  primaryPhone: string;
  secondaryPhone: string;
  systemRole: string;
  notes: string;
};

export const emptyForm: EditForm = {
  personId: '',
  firstName: '',
  lastName: '',
  email: '',
  addressLineOne: '',
  addressLineTwo: '',
  city: '',
  stateProvince: '',
  zipCode: '',
  country: '',
  primaryPhone: '',
  secondaryPhone: '',
  systemRole: '',
  notes: '',
};

export const emptyAddForm: AddForm = {
  firstName: '',
  lastName: '',
  email: '',
  addressLineOne: '',
  addressLineTwo: '',
  city: '',
  stateProvince: '',
  zipCode: '',
  country: '',
  primaryPhone: '',
  secondaryPhone: '',
  systemRole: '',
  notes: '',
};