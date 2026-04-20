import Link from "next/link";
import Card from "@/app/components/ui/Card";

type FinalMeetResult = {
  cwaNumber: string;
  callName?: string | null;
  registeredName?: string | null;
  hcScore?: number | string | null;
  dpcPoints?: number | string | null;
};

function toNumber(value?: number | string | null): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getDogName(dog: FinalMeetResult): string {
  if (dog.callName && String(dog.callName).trim() !== "") {
    return String(dog.callName);
  }

  if (dog.registeredName && String(dog.registeredName).trim() !== "") {
    return String(dog.registeredName);
  }

  return dog.cwaNumber;
}

export default function MeetSpecialWinners({
  results,
}: {
  results: FinalMeetResult[];
}) {
  const highCombinedWinner = [...results]
    .filter((dog) => toNumber(dog.hcScore) !== null)
    .sort((a, b) => {
      return (toNumber(a.hcScore) ?? Infinity) - (toNumber(b.hcScore) ?? Infinity);
    })[0] ?? null;

  const dpcPointWinners = [...results]
    .filter((dog) => (toNumber(dog.dpcPoints) ?? 0) > 0)
    .sort((a, b) => {
      const pointDiff = (toNumber(b.dpcPoints) ?? 0) - (toNumber(a.dpcPoints) ?? 0);
      if (pointDiff !== 0) {
        return pointDiff;
      }

      return getDogName(a).localeCompare(getDogName(b));
    });

  if (!highCombinedWinner && dpcPointWinners.length === 0) {
    return null;
  }

  return (
    <Card title="High Combined & DPC Point Winners">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#12301D]">
            High Combined
          </p>

          {highCombinedWinner ? (
            <div className="rounded-xl bg-black/5 px-4 py-3">
              <Link
                href={`/dog?id=${encodeURIComponent(highCombinedWinner.cwaNumber)}`}
                className="text-sm font-semibold text-[#12301D] hover:underline"
              >
                {getDogName(highCombinedWinner)}
              </Link>
            </div>
          ) : (
            <p className="text-sm text-[#12301D]/45">No high combined winner recorded.</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#12301D]">
            DPC Point Winners
          </p>

          {dpcPointWinners.length > 0 ? (
            <div className="space-y-2">
              {dpcPointWinners.map((dog) => (
                <div
                  key={dog.cwaNumber}
                  className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3"
                >
                  <Link
                    href={`/dog?id=${encodeURIComponent(dog.cwaNumber)}`}
                    className="text-sm font-semibold text-[#12301D] hover:underline"
                  >
                    {getDogName(dog)}
                  </Link>

                  <span className="text-sm font-bold text-[#2E6B3F]">
                    {toNumber(dog.dpcPoints)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#12301D]/45">No DPC points earned at this meet.</p>
          )}
        </div>
      </div>
    </Card>
  );
}