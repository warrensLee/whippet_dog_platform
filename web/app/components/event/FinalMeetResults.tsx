import Link from "next/link";
import Card from "@/app/components/ui/Card";

type FinalMeetResult = {
  CWANumber: string;
  Place?: number | string | null;
  Grade?: string | null;
  CallName?: string | null;
  RegisteredName?: string | null;
  OwnerName?: string | null;
  OwnerIDs?: string | null;
  MeetPoints?: number | string | null;
  ScratchDQInfo?: string | null;
  Incident?: string | null;
  ARX?: number | string | null;
  NARX?: number | string | null;
  EntryType?: string | null;
  HCScore?: number;
  MatchPoints?: string;
  DPCPoints?: string;
};

function ResultsTable({
  title,
  results,
}: {
  title: string;
  results: FinalMeetResult[];
}) {
  const formatValue = (value?: string | number | null): string => {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
  };

  return (
    <div>
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#12301D]/75">
        {title}
      </p>

      {results.length === 0 ? (
        <p className="py-2 text-sm text-[#12301D]/40">No results found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[14px] leading-tight text-[#12301D] [td]:align-middle">
            <thead>
              <tr className="border-b border-[#12301D]/20 text-[10px] font-bold uppercase tracking-[0.08em] text-[#12301D]/75">
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">Place</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">Dog</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">ARX</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">NARX</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">Match Points</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">DPC Points</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">HC Score</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">Incident</th>
              </tr>
            </thead>

            <tbody>
              {results.map((dog, index) => (
                <tr
                  key={`${dog.CWANumber}-${index}`}
                  className="border-b border-[#12301D]/10 align-top hover:bg-[#DCE7DF]/35"
                >
                  <td className="px-2 py-1 whitespace-nowrap">
                    {formatValue(dog.Place)}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap font-semibold">
                    <Link
                      href={`/dog?id=${encodeURIComponent(dog.CWANumber)}`}
                      className="text-[#12301D] font-medium hover:underline"
                    >
                      <div className="font-semibold">
                        {formatValue(dog.CallName)}
                      </div>
                      <div className="text-[13px] text-[#12301D]/70">
                        {formatValue(dog.RegisteredName)}
                      </div>
                    </Link>
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-[13px]">
                    {formatValue(dog.ARX)}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-[13px]">
                    {formatValue(dog.NARX)}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-[13px]">
                    {formatValue(dog.MatchPoints)}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-[13px]">
                    {formatValue(dog.DPCPoints)}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-[13px]">
                    {formatValue(dog.HCScore)}
                  </td>
                  <td className="px-2 py-1 max-w-[140px] text-[13px]">
                    {formatValue(dog.Incident ?? dog.ScratchDQInfo)}
                  </td>


                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function FinalMeetResults({
  results,
}: {
  results: FinalMeetResult[];
}) {
  const adultResults = results.filter(
    (dog) => String(dog.EntryType ?? "").trim().toUpperCase() !== "PUPPY"
  );

  const puppyResults = results.filter(
    (dog) => String(dog.EntryType ?? "").trim().toUpperCase() === "PUPPY"
  );

  return (
    <Card title={`Final Meet Results${results.length ? ` (${results.length})` : ""}`}>
      {results.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#12301D]/40">
          No final meet results found.
        </p>
      ) : (
        <div className="space-y-6">
          <ResultsTable title="Adult Results" results={adultResults} />
          {puppyResults.length > 0 && (
            <ResultsTable title="Puppy Results" results={puppyResults} />
          )}
        </div>
      )}
    </Card>
  );
}