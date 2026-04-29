export type DogRace = {
    program: string,
    race: string,
    entryType: string,
    box: string,
    placement: string,
    incident: string
}


export type DogEntry = {
    shown: boolean
    callName: string,
    grade: string,
    average: number,
    cwaNumber: string,
    registeredName: string
    showPoints: string
    showPlace: string
    races: DogRace[]
}

export type MeetResults = DogEntry[]

export type DogEntryResponse = {
    ok: true,
    entries: MeetResults
}

export type ErroResponse = {
    ok: false,
    error: string
}

export type MeetResultEditResponse = DogEntryResponse | ErroResponse