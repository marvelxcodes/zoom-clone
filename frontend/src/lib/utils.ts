export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatMeetingId(id: string) {
  if (id.length === 10) return `${id.slice(0, 3)} ${id.slice(3, 7)} ${id.slice(7)}`;
  if (id.length === 11) return `${id.slice(0, 3)} ${id.slice(3, 7)} ${id.slice(7)}`;
  return id;
}

export function parseServerDate(iso: string | null | undefined) {
  if (!iso) return null;
  const s = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  return new Date(s);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
