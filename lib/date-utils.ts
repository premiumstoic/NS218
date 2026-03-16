/**
 * Format a date as relative time (e.g., "2 hours ago", "5 minutes ago")
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""}`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""}`;
  } else {
    return date.toLocaleDateString();
  }
}
