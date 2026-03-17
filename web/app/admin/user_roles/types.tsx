export enum ScopeValue {
    NONE = 0,
    SELF = 1,
    ANY = 2
}
export default class UserRole {
    id?: number;
    title: string;
    editDogScope: ScopeValue;
    editPersonScope: ScopeValue;
    editDogOwnerScope: ScopeValue;
    editUserRoleScope: ScopeValue;
    editClubScope: ScopeValue;
    editMeetScope: ScopeValue;
    editMeetResultsScope: ScopeValue;
    editRaceResultsScope: ScopeValue;
    editDogTitlesScope: ScopeValue;
    editTitleTypeScope: ScopeValue;
    editNewsScope: ScopeValue;
    editDatabaseScope: ScopeValue;
    last_edited_by?: string | null;
    last_edited_at?: string | null;

    constructor(data?: Partial<UserRole>) {
        this.id = data?.id;
        this.title = (data?.title || "").trim().toUpperCase();
        this.editDogScope = data?.editDogScope ?? 0;
        this.editPersonScope = data?.editPersonScope ?? 0;
        this.editDogOwnerScope = data?.editDogOwnerScope ?? 0;
        this.editUserRoleScope = data?.editUserRoleScope ?? 0;
        this.editClubScope = data?.editClubScope ?? 0;
        this.editMeetScope = data?.editMeetScope ?? 0;
        this.editMeetResultsScope = data?.editMeetResultsScope ?? 0;
        this.editRaceResultsScope = data?.editRaceResultsScope ?? 0;
        this.editDogTitlesScope = data?.editDogTitlesScope ?? 0;
        this.editTitleTypeScope = data?.editTitleTypeScope ?? 0;
        this.editNewsScope = data?.editNewsScope ?? 0;
        this.editDatabaseScope = data?.editDatabaseScope ?? 0;
        this.last_edited_by = data?.last_edited_by ?? null;
        this.last_edited_at = data?.last_edited_at ?? null;
    }
}

export const SCOPE_FIELDS: Array<{ key: keyof UserRole, label: string }> = [
    { key: 'editDogScope', label: 'Edit Dogs' },
    { key: 'editPersonScope', label: 'Edit people' },
    { key: 'editDogOwnerScope', label: 'Edit owners' },
    { key: 'editUserRoleScope', label: 'Edit User Roles' },
    { key: 'editClubScope', label: 'Edit Club' },
    { key: 'editMeetScope', label: 'Edit Meet' },
    { key: 'editMeetResultsScope', label: 'Edit Meet Results' },
    { key: 'editRaceResultsScope', label: 'Edit Race Results' },
    { key: 'editDogTitlesScope', label: 'Edit Dog Titles' },
    { key: 'editTitleTypeScope', label: 'Edit Title Types' },
];