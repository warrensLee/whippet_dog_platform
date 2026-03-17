// backend/classes/person.ts
export class Person {
    personId: number;
    firstName: string;
    lastName: string;
    addressLineOne: string;
    addressLineTwo: string;
    city: string;
    stateProvince: string;
    zipCode: string;
    country: string;
    primaryPhone: string;
    secondaryPhone: string;
    constructor(object: Partial<Person>) {
        this.personId = object.personId!;
        this.firstName = object.firstName || "";
        this.lastName = object.lastName || "";
        this.addressLineOne = object.addressLineOne || "";
        this.addressLineTwo = object.addressLineTwo || "";
        this.city = object.city || "";
        this.stateProvince = object.stateProvince || "";
        this.zipCode = object.zipCode || "";
        this.country = object.country || "";
        this.primaryPhone = object.primaryPhone || "";
        this.secondaryPhone = object.secondaryPhone || "";
    }

}