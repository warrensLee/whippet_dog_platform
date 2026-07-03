import Link from "next/link";
import Card from "@/app/components/ui/Card";
import { FinalMeetResult } from "./types";

const TABLE_HEADER_ITEM_STYLE = "px-1.5 py-[2px] text-left whitespace-nowrap"
const TABLE_POINTS_STYLE = "px-2 py-1 whitespace-nowrap text-[13px]";
const TABLE_TITLE_STYLE = "mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#12301D]/75";
const TABLE_HEADER_STYLE = "border-b border-[#12301D]/20 text-[10px] font-bold uppercase tracking-[0.08em] text-[#12301D]/75";
const TABLE_STYLE = "min-w-full border-collapse text-[14px] leading-tight text-[#12301D] [td]:align-middle";

function formatValue(value?: string | number | null, allowZero: boolean = false): string {
  if (value === null || value === undefined || value === "" || (value == 0 && !allowZero)) return "";
  return String(value);
};

function ShowResultsTable({ results }: { results: FinalMeetResult[] }) {
  return (
    <div>
      <p className={TABLE_TITLE_STYLE}>
        Show
      </p>
      <div className="overflow-x-auto">
        <table className={TABLE_STYLE}>
          <thead>
            <tr className={TABLE_HEADER_STYLE}>
              <th className={TABLE_HEADER_ITEM_STYLE}>Show Place</th>
              <th className={TABLE_HEADER_ITEM_STYLE}>Dog</th>
              <th className={TABLE_HEADER_ITEM_STYLE}>Show Points</th>
              <th className={TABLE_HEADER_ITEM_STYLE}>DPC points</th>
            </tr>
          </thead>
          <tbody>
            {results.map((dog, index) => (
              <tr
                key={`${dog.cwaNumber}-${index}`}
                className="border-b border-[#12301D]/10 align-top hover:bg-[#DCE7DF]/35"
              >
                <td className="px-2 py-1 whitespace-nowrap">
                  {formatValue(dog.showPlacement)}
                </td>
                <td className="px-2 py-1 whitespace-nowrap font-semibold">
                  <Link
                    href={`/dog?id=${encodeURIComponent(dog.cwaNumber)}`}
                    className="text-[#12301D] font-medium hover:underline"
                  >
                    <div className="font-semibold">
                      {formatValue(dog.callName)}
                    </div>
                    <div className="text-[13px] text-[#12301D]/70">
                      {formatValue(dog.registeredName)}
                    </div>
                  </Link>
                </td>
                <td className={TABLE_POINTS_STYLE}>
                  {formatValue(dog.showPoints)}
                </td>
                <td className={TABLE_POINTS_STYLE}>
                  {formatValue(dog.dpcPoints)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

  )
}

function ResultsTable({
  title,
  results,
}: {
  title: string;
  results: FinalMeetResult[];
}) {


  return (
    <div>
      <p className={TABLE_TITLE_STYLE}>
        {title}
      </p>
      <div className="overflow-x-auto">
        <table className={TABLE_STYLE}>
          <thead>
            <tr className={TABLE_HEADER_STYLE}>
              <th className={TABLE_HEADER_ITEM_STYLE}>Place</th>
              <th className={TABLE_HEADER_ITEM_STYLE}>Dog</th>
              <th className={TABLE_HEADER_ITEM_STYLE}>Meet Points</th>
              <th className={TABLE_HEADER_ITEM_STYLE}>Incident</th>
              <th className={TABLE_HEADER_ITEM_STYLE}>ARX</th>
              <th className={TABLE_HEADER_ITEM_STYLE}>NARX</th>
            </tr>
          </thead>
          <tbody>
            {results.map((dog, index) => (
              <tr
                key={`${dog.cwaNumber}-${index}`}
                className="border-b border-[#12301D]/10 align-top hover:bg-[#DCE7DF]/35"
              >
                <td className="px-2 py-1 whitespace-nowrap">
                  {formatValue(dog.place)}
                </td>
                <td className="px-2 py-1 whitespace-nowrap font-semibold">
                  <Link
                    href={`/dog?id=${encodeURIComponent(dog.cwaNumber)}`}
                    className="text-[#12301D] font-medium hover:underline"
                  >
                    <div className="font-semibold">
                      {formatValue(dog.callName)}
                    </div>
                    <div className="text-[13px] text-[#12301D]/70">
                      {formatValue(dog.registeredName)}
                    </div>
                  </Link>
                </td>
                <td className={TABLE_POINTS_STYLE}>
                  {formatValue(dog.meetPoints, true)}
                </td>
                <td className="px-2 py-1 max-w-[140px] text-[13px]">
                  {formatValue(dog.incident ?? dog.scratchDQInfo)}
                </td>
                <td className={TABLE_POINTS_STYLE}>
                  {formatValue(dog.arxEarned)}
                </td>
                <td className={TABLE_POINTS_STYLE}>
                  {formatValue(dog.narxEarned)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FinalMeetResults({
  results,
}: {
  results: FinalMeetResult[];
}) {
  const adultResults = results.filter(
    (dog) => String(dog.entryType ?? "").trim().toUpperCase() !== "PUPPY"
  );

  const puppyResults = results.filter(
    (dog) => String(dog.entryType ?? "").trim().toUpperCase() === "PUPPY"
  );

  const showResults = results.filter(
    (dog) => dog.shown
  ).sort((a, b) => Number(a.showPlacement || Infinity) - Number(b.showPlacement || Infinity))

  return (
    <Card title={`Final Meet Results${results.length ? ` (${results.length})` : ""}`}>
      {results.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#12301D]/40">
          No final meet results found.
        </p>
      ) : (
        <div className="space-y-6">
          {adultResults.length > 0 && <ResultsTable title="Adult Results" results={adultResults} />}
          {puppyResults.length > 0 && (
            <ResultsTable title="Puppy Results" results={puppyResults} />
          )}
          {showResults.length > 0 && (
            <ShowResultsTable results={showResults} />
          )}
        </div>
      )}
    </Card>
  );
}