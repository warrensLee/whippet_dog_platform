"use client";

import * as React from "react";
import Link from "next/link";
import type { MeetEntry } from "../../../lib/dog/types";

export default function MeetCard({
  meet,
}: {
  meet: MeetEntry;
}) {
  const [open, setOpen] = React.useState(false);

  const meetDate = meet.MeetDate
    ? new Date(meet.MeetDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown Date";

  const meetResult = meet.meetResults?.[0];
  const placement = meetResult?.meetPlacement;
  const points = meetResult?.meetPoints;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/70 shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/90"
      >
        <div className="min-w-0 flex items-center gap-3">
          <div className="shrink-0 rounded-lg bg-[#2E6B3F]/10 px-2.5 py-1.5">
            <Link
              href={`/meet?id=${encodeURIComponent(meet.MeetNumber)}`}
              className="font-semibold text-[#12301D] hover:text-[#2E6B3F] hover:underline"
            >
              #{meet.MeetNumber}
            </Link>
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#12301D]">
              {meet.ClubAbbreviation || "Unknown Club"}{" "}
              <span className="font-normal text-[#12301D]/50">· {meetDate}</span>
            </p>
            {meet.Location && (
              <p className="truncate text-xs text-[#12301D]/45">{meet.Location}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {points != null && (
            <span className="rounded-full bg-[#2E6B3F] px-3 py-1 text-xs font-bold text-white">
              {points} pts
            </span>
          )}
          {placement != null && (
            <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[#12301D]/70">
              #{placement}
            </span>
          )}
          <svg
            className={`h-4 w-4 text-[#12301D]/40 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-black/8 px-4 py-3">
          {meet.meetResults && meet.meetResults.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#12301D]/40">
                Meet Results
              </p>
              <div className="space-y-1.5">
                {meet.meetResults.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-lg bg-black/5 px-3 py-2 text-xs"
                  >
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {r.meetPlacement != null && (
                        <span>
                          <span className="font-bold text-[#2E6B3F]">#{r.meetPlacement}</span>
                          <span className="ml-1 text-[#12301D]/50">Place</span>
                        </span>
                      )}

                      {r.conformationPlacement != null && (
                        <span className="text-[#12301D]/70">
                          Conformation:{" "}
                          <span className="font-semibold text-[#12301D]">
                            #{r.conformationPlacement}
                          </span>
                        </span>
                      )}

                      {r.matchPoints != null && (
                        <span className="text-[#12301D]/70">
                          Match Pts:{" "}
                          <span className="font-semibold text-[#12301D]">
                            {r.matchPoints}
                          </span>
                        </span>
                      )}

                      {r.arxEarned != null && (
                        <span className="text-[#12301D]/70">
                          ARX:{" "}
                          <span className="font-semibold text-[#12301D]">
                            {r.arxEarned}
                          </span>
                        </span>
                      )}

                      {r.narxEarned != null && (
                        <span className="text-[#12301D]/70">
                          NARX:{" "}
                          <span className="font-semibold text-[#12301D]">
                            {r.narxEarned}
                          </span>
                        </span>
                      )}

                      {r.dpcPoints != null && (
                        <span className="text-[#12301D]/70">
                          DPC Pts:{" "}
                          <span className="font-semibold text-[#12301D]">
                            {r.dpcPoints}
                          </span>
                        </span>
                      )}

                      {r.hcScore != null && (
                        <span className="text-[#12301D]/70">
                          HC Score:{" "}
                          <span className="font-semibold text-[#12301D]">
                            {r.hcScore}
                          </span>
                        </span>
                      )}

                      {r.dpcLeg === 1 && (
                        <span className="font-semibold text-[#2E6B3F]">DPC Leg ✓</span>
                      )}
                    </div>

                    {r.meetPoints != null && (
                      <span className="whitespace-nowrap font-semibold text-[#2E6B3F]">
                        {r.meetPoints} pt
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {meet.raceResults && meet.raceResults.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#12301D]/40">
                Race Results
              </p>
              <div className="space-y-1.5">
                {meet.raceResults.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-lg bg-black/5 px-3 py-2 text-xs"
                  >
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {r.program != null && (
                        <span className="text-[#12301D]/70">
                          Prog{" "}
                          <span className="font-semibold text-[#12301D]">
                            {r.program}
                          </span>
                        </span>
                      )}

                      {r.raceNumber != null && (
                        <span className="text-[#12301D]/70">
                          Race{" "}
                          <span className="font-semibold text-[#12301D]">
                            {r.raceNumber}
                          </span>
                        </span>
                      )}

                      {r.dpcPoints != null && (
                        <span className="text-[#12301D]/70">
                          DPC Pts:{" "}
                          <span className="font-semibold text-[#12301D]">
                            {r.dpcPoints}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {r.meetPoints != null && (
                        <span className="whitespace-nowrap font-semibold text-[#12301D]/70">
                          {r.meetPoints} pt
                        </span>
                      )}

                      {r.placement != null && (
                        <span className="whitespace-nowrap font-bold text-[#2E6B3F]">
                          #{r.placement}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!meet.meetResults?.length && !meet.raceResults?.length && (
            <p className="text-xs text-[#12301D]/50">No detailed results available.</p>
          )}
        </div>
      )}
    </div>
  );
}