export default class TitleType {
    id?: number;
    title: string;
    titleDescription: string;
    lastEditedBy?: string | null;
    lastEditedAt?: string | null;

    constructor(data?: Partial<TitleType>) {
        this.id = data?.id;
        this.title = (data?.title || "").trim().toUpperCase();
        this.titleDescription = data?.titleDescription || "";
        this.lastEditedBy = data?.lastEditedBy ?? null;
        this.lastEditedAt = data?.lastEditedAt ?? null;
    }
}