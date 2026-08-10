import { MeetSearchResult } from "@/app/admin/events/types";
import { formatDate } from "@/lib/ui/formatDate";
import Link from "next/link";

export default function MeetCard({ m }: { m: MeetSearchResult }) {
    return (
        <div
            key={m.id}
            className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur p-5 shadow-sm transition hover:shadow-md hover:-translate-y-[2px] hover:border-[#2E6B3F]/35"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <Link
                        href={`/meet?id=${m.meetNumber}`}
                        className="text-xl font-semibold text-[#12301D] hover:text-[#2E6B3F] underline-offset-4 hover:underline transition"
                    >
                        Meet {m.meetNumber || "Untitled"}
                    </Link>
                </div>

                <div className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-[#2E6B3F]/10 text-[#2E6B3F]">
                    {m.clubAbbreviation || "—"}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-[#12301D]/80">
                <div>
                    <span className="font-medium text-[#000000]">
                        Date
                    </span>
                    : {m.meetDate ? formatDate(m.meetDate) : "—"}
                </div>

                <div>
                    <span className="font-medium text-[#000000]">
                        Location
                    </span>
                    : {m.location || "—"}
                </div>

                <div>
                    <span className="font-medium text-[#000000]">
                        Judge
                    </span>
                    : {m.judgeName || "—"}
                </div>

                <div>
                    <span className="font-medium text-[#000000]">
                        Race Secretary
                    </span>
                    : {m.raceSecretaryName || "—"}
                </div>

                <div className="col-span-2">
                    <span className="font-medium text-[#000000]">
                        Yards
                    </span>
                    : {m.yards || "—"}
                </div>
                <div className="col-span-2">
                    <span className="font-medium text-[#000000]">
                        Event Meets
                    </span>
                    : {m.eventMeetCount ?? 0} / 3
                </div>
            </div>

            <div className="mt-4 h-px w-full bg-gradient-to-r from-[#2E6B3F]/35 via-black/5 to-transparent" />

            <div className="mt-4 flex flex-wrap gap-3">
                <Link
                    href={`/meet?id=${m.meetNumber}`}
                    className="rounded-full bg-[#2E6B3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#255733] transition"
                >
                    View Meet
                </Link>
            </div>
        </div>
    );
}