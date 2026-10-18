export function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} h ${mins % 60} min`;
  return `${Math.floor(h / 24)} d`;
}

export function hoursRemaining(allocatedAt, expectedHours) {
  const elapsed = (Date.now() - new Date(allocatedAt).getTime()) / 3600000;
  return expectedHours - Math.max(0, elapsed);
}

export function formatRemaining(hours) {
  if (hours <= 0) return "any time now";
  if (hours < 1) return `in ~${Math.max(1, Math.round(hours * 60))} min`;
  return `in ~${hours.toFixed(1)} h`;
}
