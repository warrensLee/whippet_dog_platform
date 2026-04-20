export enum ScopeValue {
    NONE = 0,
    SELF = 1,
    ANY = 2
}
export default class UserRole {
    id?: number;
    title: string;
    editDogScope: ScopeValue;
    editMeetScope: ScopeValue;
    editTitleTypeScope: ScopeValue;
    last_edited_by?: string | null;
    last_edited_at?: string | null;

    constructor(data?: Partial<UserRole>) {
        this.id = data?.id;
        this.title = (data?.title || "").trim().toUpperCase();
        this.editDogScope = data?.editDogScope ?? 0;
        this.editMeetScope = data?.editMeetScope ?? 0;
        this.editTitleTypeScope = data?.editTitleTypeScope ?? 0;
        this.last_edited_by = data?.last_edited_by ?? null;
        this.last_edited_at = data?.last_edited_at ?? null;
    }
}

export const SCOPE_FIELDS: Array<{ key: keyof UserRole, label: string }> = [
    { key: 'editDogScope', label: 'Edit Dogs (incl. owners & titles)' },
    { key: 'editMeetScope', label: 'Edit Meet' },
    { key: 'editTitleTypeScope', label: 'Edit Title Types' },
];