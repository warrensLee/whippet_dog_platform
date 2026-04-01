"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import HeroSection from "../../components/HeroSection";
import FieldRow from "../../components/FieldRow";
import StatPill from "../../components/StatPill";
import Card from "../../components/Card";
import PointBar from "../../components/PointBar";
import MeetCard from "../../components/MeetCard";
import TitleFamilyCard from "../../components/TitleFamilyCard";

import { fetchJson } from "../../../lib/ui/fetchJson";
import { formatDate } from "../../../lib/ui/formatDate";

import { TITLE_FAMILIES } from "../../../lib/dog/constants";
import { ageLabel, calcAgeMonths, getStatusColor } from "../../../lib/dog/utils";
import type { DogDetail, DogOwner, MeetEntry } from "../../../lib/dog/types";

export default function DogPage() {
  const params = useParams();
  const cwaNumber = decodeURIComponent(String(params.id ?? ""));
  const encodedCwaNumber = encodeURIComponent(cwaNumber);

  const [dog, setDog] = React.useState<DogDetail | null>(null);
  const [meets, setMeets] = React.useState<MeetEntry[]>([]);
  const [owners, setOwners] = React.useState<DogOwner[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!cwaNumber) return;

    async function load() {
      try {
        setLoading(true);

        const [dogRes, meetsRes, ownersRes] = await Promise.allSettled([
          fetchJson<{ ok: boolean; data: DogDetail }>(`/api/dog/get/${encodedCwaNumber}`),
          fetchJson<{ ok: boolean; data: MeetEntry[] }>(`/api/dog/meets/${encodedCwaNumber}`),
          fetchJson<{ ok: boolean; data: DogOwner[] }>(`/api/dog_owner/owners/${encodedCwaNumber}`),
        ]);

        setDog(dogRes.status === "fulfilled" ? dogRes.value.data : null);
        setMeets(
          meetsRes.status === "fulfilled" && Array.isArray(meetsRes.value.data)
            ? meetsRes.value.data
            : []
        );
        setOwners(
          ownersRes.status === "fulfilled" && Array.isArray(ownersRes.value.data)
            ? ownersRes.value.data
            : []
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [cwaNumber, encodedCwaNumber]);

  const ageMonths = calcAgeMonths(dog?.birthdate);
  const maxPoints = Math.max(
    dog?.meetPoints ?? 0,
    dog?.arxPoints ?? 0,
    dog?.narxPoints ?? 0,
    dog?.showPoints ?? 0,
    1
  );

  const statusLabel = dog?.status?.trim() || "Status unknown";
  const statusColor = getStatusColor(dog?.status);

  return (
    <main className="min-h-screen bg-[#1F4D2E]">
      <HeroSection
        title={dog?.registeredName || "Dog Profile"}
        subtitle={
          dog?.callName
            ? `"${dog.callName}"`
            : "View dog details, meet history, and performance information."
        }
        topContent={
          <div className="mb-2 mt-16 flex flex-wrap justify-center gap-3">
            <Link
              href="/search"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Back to Search
            </Link>
          </div>
        }
      />

      <section className="bg-[#E7F0E9] pb-24 pt-10">
        <div className="mx-auto max-w-4xl space-y-6 px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill label="Completed Meets" value={dog?.meetAppearences ?? "—"} />
            <StatPill label="Meet Points" value={dog?.meetPoints ?? "—"} accent />
            <StatPill label="Meet Wins" value={dog?.meetWins ?? "—"} />
            <StatPill label="High Combo W" value={dog?.highCombinedWins ?? "—"} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card title="Details" className="h-full lg:col-span-2">
              {loading ? (
                <p className="text-sm text-[#12301D]/40">Loading…</p>
              ) : dog ? (
                <>
                  <FieldRow label="CWA #" value={dog.cwaNumber} />
                  <FieldRow label="Birthdate" value={formatDate(dog.birthdate)} />
                  <FieldRow label="Age" value={ageLabel(ageMonths)} />
                  <FieldRow label="Status" value={dog.status} />
                  <FieldRow label="Current Grade" value={dog.currentGrade} />
                  <FieldRow label="Registered #" value={dog.registeredNumber} />
                  <FieldRow label="Foreign Type" value={dog.foreignType} />
                  <FieldRow label="DNA" value={dog.dna} />
                  <FieldRow label="Sire DNA" value={dog.sireDna} />
                  <FieldRow label="Dam DNA" value={dog.damDna} />

                  {dog.pedigreeLink && (
                    <div className="py-2">
                      <a
                        href={dog.pedigreeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#2E6B3F] underline transition hover:text-[#1a4228]"
                      >
                        View Pedigree ↗
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#12301D]/40">No dog found.</p>
              )}
            </Card>

            <Card title="Points Breakdown" className="h-full lg:col-span-3">
              {loading ? (
                <p className="text-sm text-[#12301D]/40">Loading…</p>
              ) : dog ? (
                <>
                  <PointBar label="Meet Pts" value={dog.meetPoints ?? 0} max={maxPoints} />
                  <PointBar label="ARX Pts" value={dog.arxPoints ?? 0} max={maxPoints} />
                  <PointBar label="NARX Pts" value={dog.narxPoints ?? 0} max={maxPoints} />
                  <PointBar label="Show Pts" value={dog.showPoints ?? 0} max={maxPoints} />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className={`rounded-full px-4 py-1 text-xs font-semibold ${statusColor}`}>
                      {statusLabel}
                    </span>

                    <span className="rounded-full bg-black/5 px-4 py-1 text-xs font-semibold text-[#12301D]/70">
                      CWA #{dog.cwaNumber}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#12301D]/40">No points available.</p>
              )}
            </Card>
          </div>

          {dog && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-[#12301D]">
                Notes
              </h3>

              {dog.publicNotes ? (
                <p className="text-sm text-[#12301D]/70">
                  {dog.publicNotes}
                </p>
              ) : (
                <p className="text-sm text-[#12301D]/40 italic">
                  No notes available
                </p>
              )}

              {dog.privateNotes && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-[10px] uppercase tracking-wide text-[#12301D]/40">
                    Private
                  </p>
                  <p className="text-sm text-[#12301D]/70">
                    {dog.privateNotes}
                  </p>
                </div>
              )}
            </Card>
          )}

          <Card title={`Owner${owners.length !== 1 ? "s" : ""}${owners.length ? ` (${owners.length})` : ""}`}>
            {owners.length === 0 ? (
              <p className="py-2 text-center text-sm text-[#12301D]/40">No owners on record.</p>
            ) : (
              <div className="divide-y divide-black/5">
                {owners.map((owner, index) => {
                  const fullName =
                    [owner.FirstName, owner.LastName].filter(Boolean).join(" ") || "Unknown";

                  return (
                    <div
                      key={owner.PersonID ?? index}
                      className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2E6B3F]">
                        <span className="text-sm font-bold text-white">
                          {(owner.FirstName?.[0] ?? "?").toUpperCase()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#12301D]">
                          {fullName}
                        </p>

                        {owner.EmailAddress && (
                          <a
                            href={`mailto:${owner.EmailAddress}`}
                            className="block truncate text-xs text-[#2E6B3F] hover:underline"
                          >
                            {owner.EmailAddress}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {dog && (
            <div>
              <h2 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-[#12301D]">
                Title Progression
              </h2>

              <div className="space-y-3">
                {TITLE_FAMILIES.map((family) => (
                  <TitleFamilyCard key={family.family} family={family} dog={dog} />
                ))}
              </div>
            </div>
          )}

          <Card title={`Meet History${meets.length ? ` (${meets.length})` : ""}`}>
            {meets.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#12301D]/40">No meet records found.</p>
            ) : dog ? (
              <div className="space-y-2">
                {meets.map((meet, index) => (
                  <MeetCard
                    key={`${meet.MeetNumber}-${index}`}
                    meet={meet}
                    currentCwaNumber={dog.cwaNumber}
                  />
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-[#12301D]/40">No dog loaded.</p>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}