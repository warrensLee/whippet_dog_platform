"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HeroSection from "../components/ui/HeroSection";
import FieldRow from "../components/ui/FieldRow";
import StatPill from "../components/ui/StatPill";
import Card from "../components/ui/Card";
import PointBar from "../components/ui/PointBar";
import MeetCard from "../components/event/MeetCard";
import TitleFamilyCard from "../components/dog/TitleFamilyCard";
import authContext from "@/lib/auth/auth";

import { fetchJson } from "../../lib/ui/fetchJson";
import { formatDate } from "../../lib/ui/formatDate";

import { TITLE_FAMILIES } from "../../lib/dog/constants";
import { ageLabel, calcAgeMonths, getStatusColor } from "../../lib/dog/utils";
import type { DogDetail, DogOwner, MeetEntry } from "../../lib/dog/types";

import RichTextEditor from "@/lib/richtext/RichTextEditor";
import RichTextViewer from "@/lib/richtext/RichTextViewer";

type DogTitle = {
  cwaNumber: string;
  lastEditedAt?: string | null;
  lastEditedBy?: number | null;
  namePrefix?: string | null;
  nameSuffix?: string | null;
  title: string;
  titleDate?: string | null;
  titleNumber?: string | number | null;
};

export default function Page() {
  return (<React.Suspense><DogPage /></React.Suspense>)
}
function DogPage() {
  const params = useSearchParams();
  const cwaNumber = decodeURIComponent(String(params.get("id") ?? ""));
  const encodedCwaNumber = encodeURIComponent(cwaNumber);

  const [dog, setDog] = React.useState<DogDetail | null>(null);
  const [meets, setMeets] = React.useState<MeetEntry[]>([]);
  const [owners, setOwners] = React.useState<DogOwner[]>([]);
  const [titles, setTitles] = React.useState<DogTitle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [publicNotes, setPublicNotes] = React.useState("")
  const [editingPublicNotes, setEditingPublicNotes] = React.useState(false)
  const user = React.useContext(authContext)
  const [statsMode, setStatsMode] = React.useState<"all" | "ytd">("all");
  const [dogStats, setDogStats] = React.useState<{
    total_meet_points: number;
    total_match_points: number;
    total_hc_score: number;
    total_show_points?: number;
    total_dpc_points?: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(false);
  const currentYear = new Date().getFullYear();

  const canEditDog = (user != undefined && user != "NotAuthenticated" && (user.hasPermission("editAllDogs") || (user.hasPermission("editOwnDogs") && owners.filter((o) => o.PersonID == user.ID).length != 0)))

  React.useEffect(() => {
    if (!cwaNumber) return;

    async function load() {
      try {
        setLoading(true);

        const [dogRes, meetsRes, ownersRes, titlesRes] = await Promise.allSettled([
          fetchJson<{ ok: boolean; data: DogDetail }>(`/api/dog/get/${encodedCwaNumber}`),
          fetchJson<{ ok: boolean; data: MeetEntry[] }>(`/api/dog/meets/${encodedCwaNumber}`),
          fetchJson<{ ok: boolean; data: DogOwner[] }>(`/api/dog_owner/owners/${encodedCwaNumber}`),
          fetchJson<{ ok: boolean; data: DogTitle[] }>(`/api/dog_title/get/${encodedCwaNumber}`),
        ]);
        setPublicNotes(dogRes.status === "fulfilled" ? dogRes.value.data.publicNotes || "" : "")

        setDog(dogRes.status === "fulfilled" ? dogRes.value.data : null);
        setMeets(
          meetsRes.status === "fulfilled" && Array.isArray(meetsRes.value.data)
            ? meetsRes.value.data
            : []
        );
        console.log("dog meets data:", meetsRes.status === "fulfilled" ? meetsRes.value.data : meetsRes);
        setOwners(
          ownersRes.status === "fulfilled" && Array.isArray(ownersRes.value.data)
            ? ownersRes.value.data
            : []
        );
        setTitles(
          titlesRes.status === "fulfilled"
            ? Array.isArray(titlesRes.value.data)
              ? titlesRes.value.data
              : titlesRes.value.data
                ? [titlesRes.value.data]
                : []
            : []
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [cwaNumber, encodedCwaNumber]);

  React.useEffect(() => {
    if (!cwaNumber)
      return;

    async function loadStats() {
      try {
        setStatsLoading(true);

        const url =
          statsMode === "ytd"
            ? `/api/dog/stats/${encodedCwaNumber}/year/${currentYear}`
            : `/api/dog/stats/${encodedCwaNumber}`;

        const res = await fetchJson<{ success: boolean; data: any }>(url);

        if (res.success) {
          setDogStats(res.data);
        } else {
          setDogStats(null);
        }
      } catch {
        setDogStats(null);
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  }, [cwaNumber, encodedCwaNumber, statsMode, currentYear]);

  function savePublicNotes() {
    fetch("/api/dog/public_notes", {
      method: "POST", body: JSON.stringify({
        dog: dog?.cwaNumber,
        public_notes: publicNotes,
      }),
      headers: {
        "content-type": "application/json"
      }
    })
    setEditingPublicNotes(false)
  }
  const ageMonths = calcAgeMonths(dog?.birthdate);
  const maxPoints = Math.max(
    dogStats?.total_meet_points ?? 0,
    dogStats?.total_match_points ?? 0,
    dogStats?.total_hc_score ?? 0,
    dogStats?.total_show_points ?? dog?.adjustedShowPoints ?? dog?.showPoints ?? 0,
    dogStats?.total_dpc_points ?? dog?.adjustedDpcPoints ?? dog?.dpcPoints ?? 0,
    1
  );

  const statusLabel = dog?.status?.trim() || "Status unknown";
  const statusColor = getStatusColor(dog?.status);
  console.log(publicNotes)

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
              href="/search/dogs"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Back to Search
            </Link>

            {canEditDog && dog && (
              <Link
                href={`/admin/dogs/edit?id=${encodeURIComponent(dog.cwaNumber)}`}
                className="rounded-full border border-white/20 bg-[#2E6B3F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245532]"
              >
                Edit Dog
              </Link>
            )}
          </div>
        }
      />

      <section className="bg-[#E7F0E9] pb-24 pt-10">
        <div className="mx-auto max-w-4xl space-y-6 px-6">
          <div className="flex flex-wrap gap-6">
            <StatPill label="Completed Meets" value={dog?.meetAppearences ?? "—"} />
            <StatPill label="Meet Wins" value={dog?.meetWins ?? "—"} />
            <StatPill label="YTD Match Points" value={dog?.ytdMatchPoints ?? "—"} accent />
            <StatPill label="High Combined Wins" value={dog?.highCombinedWins ?? "—"} />
          </div>

          <div className="grid grid-cols-1 gap-6">
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
                  <FieldRow label="Meet Points" value={dog.adjustedMeetPoints ?? dog.meetPoints} />
                  <FieldRow label="ARX Points" value={dog.adjustedArxPoints ?? dog.arxPoints} />
                  <FieldRow label="NARX Points" value={dog.adjustedNarxPoints ?? dog.narxPoints} />
                  <FieldRow label="DPC Points" value={dog.adjustedDpcPoints ?? dog.dpcPoints} />
                  <FieldRow label="Registered #" value={dog.registeredNumber} />
                  <FieldRow label="Registry Type" value={dog.foreignType} />
                  <FieldRow label="AKC/CKC Champion" value={dog.kennelClubChampion ? "Yes" : "No"} />
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

            <div className="flex flex-wrap gap-2 flex-row">

            </div>

            <Card title="Points Breakdown" className="h-full lg:col-span-3">
              {loading ? (
                <p className="text-sm text-[#12301D]/40">Loading…</p>
              ) : dog ? (
                <>
                  <button
                    onClick={() => setStatsMode("all")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statsMode === "all"
                      ? "bg-[#2E6B3F] text-white"
                      : "bg-white text-[#12301D] border border-black/10"
                      }`}
                  >
                    All Time
                  </button>

                  <button
                    onClick={() => setStatsMode("ytd")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statsMode === "ytd"
                      ? "bg-[#2E6B3F] text-white"
                      : "bg-white text-[#12301D] border border-black/10"
                      }`}
                  >
                    {currentYear} YTD
                  </button>
                  <PointBar
                    label={`Meet Points (${statsMode === "ytd" ? `${currentYear} YTD` : "All Time"})`}
                    value={dogStats?.total_meet_points ?? 0}
                    max={maxPoints}
                  />

                  <PointBar
                    label={`Match Points (${statsMode === "ytd" ? `${currentYear} YTD` : "All Time"})`}
                    value={dogStats?.total_match_points ?? 0}
                    max={maxPoints}
                  />

                  <PointBar
                    label={`High Combined Points (${statsMode === "ytd" ? `${currentYear} YTD` : "All Time"})`}
                    value={dogStats?.total_hc_score ?? 0}
                    max={maxPoints}
                  />

                  {/* <PointBar
                    label={`High Combined Wins (${statsMode === "ytd" ? `${currentYear} YTD` : "All Time"})`}
                    value={dogStats?.total_hc_wins ?? 0}
                    max={maxPoints}
                  /> */}

                  <PointBar
                    label={`Show Points (${statsMode === "ytd" ? `${currentYear} YTD` : "All Time"})`}
                    value={dogStats?.total_show_points ?? dog?.adjustedShowPoints ?? dog?.showPoints ?? 0}
                    max={maxPoints}
                  />

                  <PointBar
                    label={`DPC Points (${statsMode === "ytd" ? `${currentYear} YTD` : "All Time"})`}
                    value={dogStats?.total_dpc_points ?? dog?.adjustedDpcPoints ?? dog?.dpcPoints ?? 0}
                    max={maxPoints}
                  />

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
            <Card title="">
              <p className="mb-2 text-sm font-semibold text-[#12301D]">Public Notes</p>

              {publicNotes && !editingPublicNotes && (
                <RichTextViewer text={publicNotes} />
              )}
              {editingPublicNotes && <div><RichTextEditor value={publicNotes} onChange={(v: string) => setPublicNotes(v)} style={{}} /><button type="button" onClick={savePublicNotes} className="mt-2 rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60 w-full">Save</button></div>}

              {!editingPublicNotes && user != "NotAuthenticated" && user != undefined && owners.filter((o) => o.PersonID == user.ID).length != 0 && (
                <button type="button" onClick={() => setEditingPublicNotes(true)} className="mt-2 rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60 w-full">Edit Public Notes</button>
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
                      className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 align-center"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2E6B3F]">
                        <span className="text-sm font-bold text-white">
                          {(owner.FirstName?.[0] ?? "?").toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#12301D]">
                          {fullName}
                        </p>
                      </div>
                      <div className="max-w-fit">
                        <a className="mt-2 rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60 w-full" href={"/owner?id=" + owner.userID}>View Owner</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
            }
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
                    
          {dog && (
            <Card title="DPC Progress">
              <FieldRow label="Historic DPC Legs" value={`${dog.dpcLegs ?? 0} / 5`} />
              <FieldRow label="DPC Points" value={dog.adjustedDpcPoints ?? dog.dpcPoints ?? 0} />
              <p className="mt-2 text-xs text-[#12301D]/60">
                Historic dogs may qualify through DPC legs. Current progression also tracks DPC points.
              </p>
            </Card>
          )}

          <Card title={`All Titles${titles.length ? ` (${titles.length})` : ""}`}>
            {loading ? (
              <p className="py-2 text-center text-sm text-[#12301D]/40">Loading…</p>
            ) : titles.length === 0 ? (
              <p className="py-2 text-center text-sm text-[#12301D]/40">No titles on record.</p>
            ) : (
              <div className="divide-y divide-black/5">
                {titles.map((titleItem, index) => {
                  const titleLabel = [
                    titleItem.namePrefix,
                    titleItem.title,
                    titleItem.nameSuffix,
                  ]
                    .filter((v) => v && String(v).trim() !== "")
                    .join(" ");

                  return (
                    <div
                      key={`${titleItem.title}-${titleItem.titleNumber ?? "base"}-${index}`}
                      className="py-3 first:pt-0 last:pb-0"
                    >
                      <p className="text-sm font-semibold text-[#12301D]">
                        {titleLabel || titleItem.title}
                      </p>

                      {titleItem.titleDate && (
                        <p className="mt-1 text-xs text-[#12301D]/60">
                          Earned: {formatDate(titleItem.titleDate)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title={`Meet History${meets.length ? ` (${meets.length})` : ""}`}>
            {meets.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#12301D]/40">No meet records found.</p>
            ) : dog ? (
              <div className="space-y-2">
                {meets.map((meet, index) => (
                  <MeetCard
                    key={`${meet.MeetNumber}-${index}`}
                    meet={meet}
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
