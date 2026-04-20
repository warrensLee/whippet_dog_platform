import { createContext } from "react"

enum RoleValue {
    NONE = 0,
    SELF = 1,
    ALL = 2,
}

export class Role {
    editDogScope: RoleValue = 0;
    editMeetScope: RoleValue = 0;
    editTitleTypeScope: RoleValue = 0;
}


export const PermissionMappings: Record<string, { roleField: keyof Role, minimum: RoleValue }> = {
    editOwnDogs: { roleField: "editDogScope", minimum: RoleValue.SELF },
    editOwnMeet: { roleField: "editMeetScope", minimum: RoleValue.SELF },
    editOwnTitleTypes: { roleField: "editTitleTypeScope", minimum: RoleValue.SELF },

    editAllDogOwners: { roleField: "editDogScope", minimum: RoleValue.ALL },
    editAllDogs: { roleField: "editDogScope", minimum: RoleValue.ALL },
    editAllMeet: { roleField: "editMeetScope", minimum: RoleValue.ALL },
    editAllTitleTypes: { roleField: "editTitleTypeScope", minimum: RoleValue.ALL }
} as const;

export class User {
    Authenticated: boolean = false
    EmailAddress: string;
    FirstName: string;
    LastName: string;
    PersonID: string;
    SystemRole: string;
    role: Role;
    ID: number;
    constructor(
        userObj: Partial<User>
    ) {
        this.EmailAddress = userObj.EmailAddress || "";
        this.FirstName = userObj.FirstName!;
        this.LastName = userObj.LastName!;
        this.PersonID = userObj.PersonID!;
        this.SystemRole = userObj.SystemRole || "";
        this.role = userObj.role!;
        this.ID = userObj.ID!;
    }
    hasPermission(perm: keyof typeof PermissionMappings): boolean {
        const p = PermissionMappings[perm]
        return this.role[p.roleField] >= PermissionMappings[perm].minimum;
    }

}





const authContext = createContext<User | undefined | "NotAuthenticated">(undefined);
export default authContext;




