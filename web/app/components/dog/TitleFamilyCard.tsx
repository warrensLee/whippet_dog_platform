"use client";

import * as React from "react";
import type { DogDetail, TitleFamily } from "../../../lib/dog/types";
import { TIER_STYLES } from "../../../lib/dog/constants";

export default function TitleFamilyCard({
  family,
  dog,
}: {
  family: TitleFamily;
  dog: DogDetail;
}) {
  const value = family.getValue(dog);
  const locked = family.extraCheck ? family.extraCheck(dog) : null;
  const earnedTiers = family.tiers.filter((tier) => !locked && value >= tier.threshold);
  const highestEarned = earnedTiers[earnedTiers.length - 1] ?? null;
  const nextTier = family.tiers.find((tier) => value < tier.threshold) ?? null;
  const hasAnyEarned = earnedTiers.length > 0;

  const [open, setOpen] = React.useState(hasAnyEarned);

  const progressPercent = nextTier ? Math.min(100, (value / nextTier.threshold) * 100) : 100;
  const currentStyle = highestEarned ? TIER_STYLES[highestEarned.color] : TIER_STYLES.gray;

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all ${
        hasAnyEarned ? `${currentStyle.border} shadow-sm` : "border-black/10 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
          hasAnyEarned ? currentStyle.bg : "bg-white hover:bg-black/[0.02]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              hasAnyEarned ? currentStyle.badge : "bg-black/8 text-[#12301D]/40"
            }`}
          >
            {highestEarned ? highestEarned.name : family.family}
          </span>

          <div>
            <p className={`text-sm font-semibold ${hasAnyEarned ? currentStyle.text : "text-[#12301D]/70"}`}>
              {family.family} Titles
            </p>

            <p className="mt-0.5 text-[11px] text-[#12301D]/45">
              {locked
                ? locked
                : nextTier
                ? `${nextTier.threshold - value} ${family.unit} until ${nextTier.name}`
                : "All tiers earned"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!locked && nextTier && (
            <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-black/10 sm:block">
              <div
                className="h-full rounded-full bg-[#2E6B3F] transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          <span className="font-mono text-xs tabular-nums text-[#12301D]/45">
            {value} {family.unit}
          </span>

          <svg
            className={`h-4 w-4 text-[#12301D]/35 transition-transform ${open ? "rotate-180" : ""}`}
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
        <div className="border-t border-black/8 bg-white px-5 py-4">
          <p className="mb-4 text-xs italic text-[#12301D]/50">{family.description}</p>

          {locked && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              {locked}
            </div>
          )}

          {!locked && nextTier && (
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-[10px] text-[#12301D]/40">
                <span>
                  {value} {family.unit}
                </span>
                <span>
                  {nextTier.threshold} needed for {nextTier.name}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-black/8">
                <div
                  className="h-full rounded-full bg-[#2E6B3F] transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {family.tiers.map((tier) => {
              const earned = !locked && value >= tier.threshold;
              const isCurrent = tier === highestEarned;
              const style = TIER_STYLES[tier.color];

              return (
                <div
                  key={tier.name}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all ${
                    isCurrent
                      ? `${style.bg} ${style.border} shadow-sm`
                      : earned
                      ? `${style.bg} ${style.border} opacity-70`
                      : "border-black/8 bg-black/[0.03] opacity-50"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      earned ? style.badge : "bg-black/10"
                    }`}
                  >
                    {earned ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-black/20" />
                    )}
                  </div>

                  <span className={`text-sm font-bold tracking-wide ${earned ? style.text : "text-[#12301D]/35"}`}>
                    {tier.name}
                  </span>

                  <span className="ml-auto text-xs tabular-nums text-[#12301D]/40">
                    {tier.threshold} {family.unit}
                  </span>

                  {isCurrent && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {family.family === "DPC" && (
            <div className="mt-4 border-t border-black/8 pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#12301D]/40">
                Conformation Legs ({dog.dpcLegs ?? 0} / 5)
              </p>

              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((leg) => (
                  <div
                    key={leg}
                    className={`h-2.5 flex-1 rounded-full ${
                      (dog.dpcLegs ?? 0) >= leg ? "bg-[#2E6B3F]" : "bg-black/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}