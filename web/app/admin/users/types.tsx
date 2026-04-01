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
  id: number;
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
  locked: boolean;
  lastEditedBy?: string | null;
  lastEditedAt?: string | null;
};

export type EditForm = {
  id: number | null;
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
  locked: boolean;
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
  id: null,
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
  locked: false,
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