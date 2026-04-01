export function calcAgeMonths(birthdate?: string | null): number | null {
  if (!birthdate) return null;

  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

export function ageLabel(months: number | null): string | null {
  if (months === null) return null;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  const category =
    months < 8 ? "Puppy" :
    months >= 84 ? "Veteran" :
    months >= 14 ? "Adult" :
    "";

  return `${years > 0 ? `${years}y ` : ""}${remainingMonths}m${category ? ` · ${category}` : ""}`;
}

export function buildRaceKey(meetNumber: string | number, program: string, raceNumber: string): string {
  return `${meetNumber}-${program}-${raceNumber}`;
}

export function getStatusColor(status?: string | null): string {
  return status?.trim() === "Active"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-neutral-200 text-neutral-600";
}