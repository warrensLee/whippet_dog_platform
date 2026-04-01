"use client";

import * as React from "react";
import type { MeetEntry } from "../dog/[id]/types";

export default function MeetCard({
  meet,
  currentCwaNumber,
}: {
  meet: MeetEntry;
  currentCwaNumber: string;
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
  const placement = meetResult?.MeetPlacement;
  const points = meetResult?.MeetPoints;

  return (
    <div className="rounded-2xl border border-black/10 bg-white/80 shadow-sm transition hover:shadow-md">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2E6B3F]/10">
            <span className="text-xs font-bold text-[#2E6B3F]">
              #{meet.MeetNumber}
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#12301D]">
              {meet.ClubAbbreviation || "Unknown Club"}{" "}
              <span className="font-normal text-[#12301D]/50">· {meetDate}</span>
            </p>

            {meet.Location && (
              <p className="text-xs text-[#12301D]/40">{meet.Location}</p>
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

          <span className="text-xs text-[#12301D]/30">
            {open ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-black/5 px-5 pb-4 pt-3">
          {/* Meet Results */}
          {meet.meetResults && meet.meetResults.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#12301D]/40">
                Meet Results
              </p>

              <div className="flex flex-wrap gap-3">
                {meet.meetResults.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-black/8 bg-[#E7F0E9] px-4 py-2 text-xs text-[#12301D]"
                  >
                    {r.MeetPlacement != null && (
                      <span className="mr-2 font-bold">Place: #{r.MeetPlacement}</span>
                    )}
                    {r.MeetPoints != null && (
                      <span className="mr-2">Pts: {r.MeetPoints}</span>
                    )}
                    {r.ARXEarned != null && (
                      <span className="mr-2">ARX: {r.ARXEarned}</span>
                    )}
                    {r.NARXEarned != null && (
                      <span className="mr-2">NARX: {r.NARXEarned}</span>
                    )}
                    {r.ShowPoints != null && (
                      <span className="mr-2">Show: {r.ShowPoints}</span>
                    )}
                    {r.DPCLeg === 1 && (
                      <span className="font-semibold text-[#2E6B3F]">DPC Leg ✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Race Results */}
          {meet.raceResults && meet.raceResults.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#12301D]/40">
                Race Results
              </p>

              <div className="flex flex-wrap gap-2">
                {meet.raceResults.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-black/8 bg-white px-4 py-2 text-xs text-[#12301D]"
                  >
                    {r.Program != null && (
                      <span className="mr-2 font-semibold">Prog {r.Program}</span>
                    )}
                    {r.RaceNumber != null && (
                      <span className="mr-2">Race {r.RaceNumber}</span>
                    )}
                    {r.Placement != null && (
                      <span>Place: #{r.Placement}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!meet.meetResults?.length && !meet.raceResults?.length) && (
            <p className="text-xs text-[#12301D]/40">No detailed results available.</p>
          )}
        </div>
      )}
    </div>
  );
}