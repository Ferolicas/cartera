export const periods = ["day", "week", "month", "quarter", "year"] as const;
export type Period = (typeof periods)[number];

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseCivilDate(value: string) {
  if (!isoDatePattern.test(value)) {
    throw new Error("Fecha no válida");
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Fecha no válida");
  }

  return date;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isCivilDate(value: string) {
  try {
    parseCivilDate(value);
    return true;
  } catch {
    return false;
  }
}

export function dateRangeForPeriod(anchor: string, period: Period) {
  const date = parseCivilDate(anchor);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  let start: Date;
  let end: Date;

  if (period === "day") {
    start = new Date(date);
    end = new Date(date);
  } else if (period === "week") {
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    start = new Date(date);
    start.setUTCDate(date.getUTCDate() - mondayOffset);
    end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
  } else if (period === "month") {
    start = new Date(Date.UTC(year, month, 1));
    end = new Date(Date.UTC(year, month + 1, 0));
  } else if (period === "quarter") {
    const firstMonth = Math.floor(month / 3) * 3;
    start = new Date(Date.UTC(year, firstMonth, 1));
    end = new Date(Date.UTC(year, firstMonth + 3, 0));
  } else {
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year, 11, 31));
  }

  return { start: toIsoDate(start), end: toIsoDate(end) };
}

export function todayInMadrid(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
