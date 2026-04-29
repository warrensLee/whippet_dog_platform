import { DogDetail, TierColor, TitleFamily } from "./types";

export const TIER_STYLES: Record<
  TierColor,
  { bg: string; text: string; border: string; badge: string }
> = {
  gray: {
    bg: "bg-neutral-100",
    text: "text-neutral-400",
    border: "border-neutral-200",
    badge: "bg-neutral-200 text-neutral-500",
  },
  yellow: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
  blue: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
  purple: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
  gold: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
  teal: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-[#2E6B3F] text-white",
  },
};

export const TITLE_FAMILIES: TitleFamily[] = [
  {
    family: "TRP",
    description: "Title of Racing Proficiency — complete all 4 heats at 10 meets",
    unit: "meets",
    getValue: (dog: DogDetail) => dog.meetAppearences ?? 0,
    tiers: [{ name: "TRP", threshold: 10, color: "blue" }],
  },
  {
    family: "PR",
    description: "Performance Racer — earn race points by completing meets",
    unit: "meet pts",
    getValue: (dog: DogDetail) => dog.adjustedMeetPoints ?? dog.meetPoints ?? 0,
    tiers: [
      { name: "PR", threshold: 50, color: "yellow" },
      { name: "PR2", threshold: 150, color: "blue" },
      { name: "PR3", threshold: 250, color: "purple" },
      { name: "PR4", threshold: 350, color: "gold" },
      { name: "PRX", threshold: 450, color: "green" },
    ],
  },
  {
    family: "ARX",
    description: "Award of Racing Excellence — place in top 50% of adult finishers",
    unit: "ARX pts",
    getValue: (dog: DogDetail) => dog.adjustedArxPoints ?? dog.arxPoints ?? 0,
    tiers: [{ name: "ARX", threshold: 15, color: "green" }],
  },
  {
    family: "NARX/SRA",
    description: "National Racing Excellence — earned through NARX points",
    unit: "NARX pts",
    getValue: (dog: DogDetail) => dog.adjustedNarxPoints ?? dog.narxPoints ?? 0,
    tiers: [
      { name: "NARX", threshold: 15, color: "yellow" },
      { name: "NARX2", threshold: 30, color: "blue" },
      { name: "NARX3", threshold: 45, color: "purple" },
      { name: "NARX4", threshold: 60, color: "gold" },
      { name: "SRA", threshold: 75, color: "teal" },
      { name: "SRA2", threshold: 150, color: "teal" },
      { name: "SRA3", threshold: 225, color: "teal" },
      { name: "SRA4", threshold: 300, color: "green" },
    ],
  },
  {
    family: "DPC",
    description: "Dual Purpose Championship — requires TRP + AKC/CKC bench championship OR 5 DPC legs",
    unit: "DPC legs",
    getValue: (dog: DogDetail) => dog.dpcLegs ?? 0,
    tiers: [
      { name: "DPC", threshold: 5, color: "blue" },
      { name: "DPCX", threshold: 5, color: "green" },
    ],
    extraCheck: (dog: DogDetail) =>
      (dog.meetAppearences ?? 0) >= 10 ? null : "Requires TRP first",
  },
  {
    family: "HC",
    description: "High Combined — wins High Combined at meets (adult dogs only)",
    unit: "HC wins",
    getValue: (dog: DogDetail) => dog.highCombinedWins ?? 0,
    tiers: [
      { name: "HC", threshold: 5, color: "yellow" },
      { name: "HCX", threshold: 10, color: "blue" },
      { name: "HCX2", threshold: 15, color: "purple" },
      { name: "HCX3", threshold: 20, color: "gold" },
      { name: "HCX4", threshold: 25, color: "green" },
    ],
    extraCheck: (dog: DogDetail) => {
      if (!dog.birthdate) return "Birthdate required to verify age";
      const birth = new Date(dog.birthdate);
      const now = new Date();
      const ageMonths =
        (now.getFullYear() - birth.getFullYear()) * 12 +
        (now.getMonth() - birth.getMonth());
      return ageMonths >= 14 ? null : "Adult dogs only (14+ months)";
    },
  },
];
