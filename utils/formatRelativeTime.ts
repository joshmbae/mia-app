/** German relative-time label for a past ISO timestamp, e.g. "vor 12 Min.". */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std.`;

  const now = new Date();
  const then = new Date(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfThen.getTime()) / 86400000);

  if (dayDiff === 1) return "gestern";
  if (dayDiff > 1 && dayDiff < 7) return `vor ${dayDiff} Tagen`;

  return then.toLocaleDateString("de-DE", { day: "2-digit", month: "long" });
}
