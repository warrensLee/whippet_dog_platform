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
};

export default function FinalMeetResults({
  results,
}: {
  results: FinalMeetResult[];
}) {
  const formatValue = (value?: string | number | null): string => {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
  };

  const renderOwners = (dog: FinalMeetResult) => {
    if (!dog.OwnerName || !dog.OwnerIDs) {
      return "—";
    }

    const names = String(dog.OwnerName).split(", ");
    const ids = String(dog.OwnerIDs).split(",");

    return names.map((name, index) => {
      const ownerId = ids[index];

      if (!ownerId) {
        return (
          <span key={`${name}-${index}`}>
            {name}
            {index < names.length - 1 && ", "}
          </span>
        );
      }

      return (
        <span key={ownerId}>
          <Link
            href={`/owner?id=${encodeURIComponent(ownerId)}`}
            className="text-[#12301D] font-medium hover:underline"
          >
            {name}
          </Link>
          {index < names.length - 1 && ", "}
        </span>
      );
    });
  };

  return (
    <Card title={`Final Meet Results${results.length ? ` (${results.length})` : ""}`}>
      {results.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#12301D]/40">
          No final meet results found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[14px] leading-tight text-[#12301D] [td]:align-middle">
            <thead>
              <tr className="border-b border-[#12301D]/20 text-[10px] font-bold uppercase tracking-[0.08em] text-[#12301D]/75">
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">CWA #</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">Place</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">Grade</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">Dog</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">Owner</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">Meet Points</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">Incident</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">ARX</th>
                <th className="px-1.5 py-[2px] text-left whitespace-nowrap">NARX</th>
              </tr>
            </thead>

            <tbody>
              {results.map((dog, index) => (
                <tr
                  key={`${dog.CWANumber}-${index}`}
                  className="border-b border-[#12301D]/10 align-top hover:bg-[#DCE7DF]/35"
                >
                  <td className="px-2 py-1 whitespace-nowrap font-semibold">
                    <Link
                      href={`/dog?id=${encodeURIComponent(dog.CWANumber)}`}
                      className="text-[#12301D] font-medium hover:underline"
                    >
                      {dog.CWANumber}
                    </Link>
                  </td>

                  <td className="px-2 py-1 whitespace-nowrap">
                    {formatValue(dog.Place)}
                  </td>

                  <td className="px-2 py-1 whitespace-nowrap text-[13px]">
                    {formatValue(dog.Grade)}
                  </td>

                  <td className="px-2 py-1">
                    <div className="font-semibold">
                      {formatValue(dog.CallName)}
                    </div>
                    <div className="text-[13px] text-[#12301D]/70">
                      {formatValue(dog.RegisteredName)}
                    </div>
                  </td>

                  <td className="px-1 py-1 whitespace-nowrap text-[13px] text-[#12301D]">
                    {renderOwners(dog)}
                  </td>

                  <td className="px-2 py-1 whitespace-nowrap text-[13px]">
                    {formatValue(dog.MeetPoints)}
                  </td>

                  <td className="px-2 py-1 max-w-[140px] text-[13px]">
                    {formatValue(dog.Incident ?? dog.ScratchDQInfo)}
                  </td>

                  <td className="px-2 py-1 whitespace-nowrap text-[13px]">
                    {formatValue(dog.ARX)}
                  </td>

                  <td className="px-2 py-1 whitespace-nowrap text-[13px]">
                    {formatValue(dog.NARX)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}