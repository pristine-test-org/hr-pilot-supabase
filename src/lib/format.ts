export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Postgres `date` columns arrive as "YYYY-MM-DD"; read them as local calendar days, not UTC. */
function toDate(value: Date | string) {
  if (value instanceof Date) return value;
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(value);
}

export function formatDate(date: Date | string) {
  const d = toDate(date);
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateRange(start: Date | string, end: Date | string) {
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
}

export function formatMonth(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(
    new Date(year, m - 1, 1)
  );
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
