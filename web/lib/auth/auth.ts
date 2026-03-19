import { createContext } from "react"

enum RoleValue {
    NONE = 0,
    SELF = 1,
    ALL = 2,
}

export class Role {
    editDatabaseScope: RoleValue = 0;
    editDogOwnerScope: RoleValue = 0;
    editDogScope: RoleValue = 0;
    editDogTitlesScope: RoleValue = 0;
    editMeetResultsScope: RoleValue = 0;
    editMeetScope: RoleValue = 0;
    editPersonScope: RoleValue = 0;
    editRaceResultsScope: RoleValue = 0;
    editTitleTypeScope: RoleValue = 0;
    editUserRoleScope: RoleValue = 0;
}

export enum Permission {
    editOwnDogs,
    editOwnDatabase,
    editOwnDogOwners,
    editOwnDogTitles,
    editOwnMeetResults,
    editOwnMeet,
    editOwnPersons,
    editOwnRaceResults,
    editOwnTitleTypes,
    editOwnUserRoles,
    editAllDatabase,
    editAllDogOwners,
    editAllDogs,
    editAllDogTitles,
    editAllMeetResults,
    editAllMeet,
    editAllPersons,
    editAllRaceResults,
    editAllTitleTypes,
    editAllUserRoles,
}

export const PermissionMappings: Record<string, { roleField: keyof Role, minimum: RoleValue }> = {
    editOwnDogs: { roleField: "editDogScope", minimum: RoleValue.SELF },
    editOwnDatabase: { roleField: "editDatabaseScope", minimum: RoleValue.SELF },
    editOwnDogOwners: { roleField: "editDogOwnerScope", minimum: RoleValue.SELF },
    editOwnDogTitles: { roleField: "editDogTitlesScope", minimum: RoleValue.SELF },
    editOwnMeetResults: { roleField: "editMeetResultsScope", minimum: RoleValue.SELF },
    editOwnMeet: { roleField: "editMeetScope", minimum: RoleValue.SELF },
    editOwnPersons: { roleField: "editPersonScope", minimum: RoleValue.SELF },
    editOwnRaceResults: { roleField: "editRaceResultsScope", minimum: RoleValue.SELF },
    editOwnTitleTypes: { roleField: "editTitleTypeScope", minimum: RoleValue.SELF },
    editOwnUserRoles: { roleField: "editUserRoleScope", minimum: RoleValue.SELF },

    editAllDatabase: { roleField: "editDatabaseScope", minimum: RoleValue.ALL },
    editAllDogOwners: { roleField: "editDogOwnerScope", minimum: RoleValue.ALL },
    editAllDogs: { roleField: "editDogScope", minimum: RoleValue.ALL },
    editAllDogTitles: { roleField: "editDogTitlesScope", minimum: RoleValue.ALL },
    editAllMeetResults: { roleField: "editMeetResultsScope", minimum: RoleValue.ALL },
    editAllMeet: { roleField: "editMeetScope", minimum: RoleValue.ALL },
    editAllPersons: { roleField: "editPersonScope", minimum: RoleValue.ALL },
    editAllRaceResults: { roleField: "editRaceResultsScope", minimum: RoleValue.ALL },
    editAllTitleTypes: { roleField: "editTitleTypeScope", minimum: RoleValue.ALL },
    editAllUserRoles: { roleField: "editUserRoleScope", minimum: RoleValue.ALL }
} as const;

export class User {
    Authenticated: boolean = false
    EmailAddress: string;
    FirstName: string;
    LastName: string;
    PersonID: string;
    SystemRole: string;
    role: Role;
    constructor(
        userObj: Partial<User>
    ) {
        this.EmailAddress = userObj.EmailAddress || "";
        this.FirstName = userObj.FirstName!;
        this.LastName = userObj.LastName!;
        this.PersonID = userObj.PersonID!;
        this.SystemRole = userObj.SystemRole || "";
        this.role = userObj.role!;
    }
    hasPermission(perm: Permission): boolean {
        return this.role[PermissionMappings[perm].roleField] >= PermissionMappings[perm].minimum;
    }

}





const authContext = createContext<User | undefined | "NotAuthenticated">(undefined);
export default authContext;




