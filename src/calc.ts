export type Sex = "male" | "female";
export type Activity = "desk" | "mixed" | "feet";

export type BodyInput = {
  weight: string;
  height: string;
  age: string;
  sex: Sex;
  activity: Activity;
};

export type Energy = { maint: number; target: number };
export type Protein = { protein: number; low: number; high: number };

const ACTIVITY: Record<Activity, number> = {
  desk: 1.4,
  mixed: 1.5,
  feet: 1.65,
};

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function energyNeeds(input: BodyInput): Energy | null {
  const wt = parseFloat(input.weight);
  const ht = parseFloat(input.height);
  const age = parseFloat(input.age);
  if (!(wt > 0) || !(ht > 0) || !(age > 0)) return null;
  const kg = wt * 0.4536;
  const cm = ht * 2.54;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + (input.sex === "male" ? 5 : -161);
  const maint = roundTo(bmr * ACTIVITY[input.activity], 10);
  const target = Math.max(input.sex === "male" ? 1600 : 1300, maint - 500);
  return { maint, target };
}

export function proteinGrams(weight: string): Protein {
  const w = parseFloat(weight) || 195;
  return {
    protein: roundTo(w * 0.82, 5),
    low: roundTo(w * 0.72, 5),
    high: roundTo(w * 0.92, 5),
  };
}

export function inchesToFeet(height: string): string {
  const inches = parseFloat(height);
  if (!(inches > 0)) return "";
  const ft = Math.floor(inches / 12);
  const inch = Math.round((inches - ft * 12) * 10) / 10;
  return `${ft} ft ${inch} in`;
}
