import { DogListItem } from "@/app/admin/dogs/types";
import Link from "next/link";

export default function DogCard({ dog }: { dog: DogListItem }) {
    return (
        <div
            className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur p-5 shadow-sm transition hover:shadow-md hover:-translate-y-[2px] hover:border-[#2E6B3F]/35"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <Link
                        href={`/dog?id=${dog.id}`}
                        className="text-xl font-semibold text-[#12301D] hover:text-[#2E6B3F] underline-offset-4 hover:underline transition"
                    >
                        {dog.registeredName || "Unnamed Dog"}
                    </Link>
                </div>

                <div className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-[#2E6B3F]/10 text-[#2E6B3F]">
                    {dog.status || "—"}
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-[#12301D]/80">
                <div>
                    <span className="font-medium text-[#000000]">
                        CWA
                    </span>
                    : {dog.cwaNumber || "—"}
                </div>

                <div>
                    <span className="font-medium text-[#000000]">
                        Year
                    </span>
                    : {dog.birthYear || "—"}
                </div>

                <div>
                    <span className="font-medium text-[#000000]">
                        Owner
                    </span>
                    : {dog.ownerName || "—"}
                </div>

                <div>
                    <span className="font-medium text-[#000000]">
                        Title
                    </span>
                    : {dog.title || "—"}
                </div>
            </div>

            <div className="mt-4 h-px w-full bg-gradient-to-r from-[#2E6B3F]/35 via-black/5 to-transparent" />
            <div className="mt-4 flex flex-wrap gap-3">
                <Link
                    href={`/dog?id=${dog.id}`}
                    className="rounded-full bg-[#2E6B3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#255733] transition"
                >
                    View Dog
                </Link>
            </div>
        </div>
    );
}