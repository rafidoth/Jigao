import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
} from "date-fns";
import type { NormalizedSetItem, SetListApiItem, SetCore } from "./types";

export const lastModified = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const minutes = differenceInMinutes(now, date);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours} hours ago`;
  const days = differenceInDays(now, date);
  if (days < 7) return `${days} days ago`;
  const weeks = differenceInWeeks(now, date);
  if (weeks < 4) return `${weeks} weeks ago`;
  const months = differenceInMonths(now, date);
  if (months < 12) return `${months} months ago`;
  const years = differenceInYears(now, date);
  return `${years} years ago`;
};

const fallbackSet = (item: SetListApiItem): SetCore => ({
  id: item.id ?? "",
  title: item.title ?? "Untitled",
  visibility: item.visibility ?? "private",
  updated_at: item.updated_at ?? new Date(0).toISOString(),
});

export function normalizeSetItem(item: SetListApiItem): NormalizedSetItem {
  return {
    set: item.set ?? fallbackSet(item),
    owner: item.owner ?? {},
  };
}
