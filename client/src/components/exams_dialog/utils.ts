import { format, isThisWeek, isToday, isTomorrow, isYesterday } from "date-fns";

export function nowLocalForInput(offsetMinutes: number = 0) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + offsetMinutes);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function splitLocalDateTime(localValue: string) {
  if (!localValue) return { date: "", time: "" };
  const [date, time] = localValue.split("T");
  return { date, time: (time ?? "").slice(0, 5) };
}

export function combineDateTime(date: string, time: string) {
  if (!date) return "";
  const t = (time || "00:00").slice(0, 5);
  return `${date}T${t}`;
}

export function todayForDateInput() {
  return nowLocalForInput().slice(0, 10);
}

export function toISOFromLocal(localValue: string) {
  if (!localValue) return "";
  return new Date(localValue).toISOString();
}

export function validateExamInputs(
  title: string,
  startTimeLocal: string,
  durationInMinutes: number,
) {
  let error = "";
  if (!title || title.trim() === "") error = "Title is required";
  else if (!startTimeLocal) error = "Start time is required";
  else if (new Date(startTimeLocal) <= new Date()) {
    error = "Start time must be in the future";
  } else if (!durationInMinutes || durationInMinutes <= 0) {
    error = "Duration must be greater than 0";
  }

  return { error, isError: error !== "" };
}

export const formatDateFriendly = (date: Date, duration?: number) => {
  let dateString = "";

  if (isToday(date)) {
    dateString = `Today at ${format(date, "h:mm a")}`;
  } else if (isTomorrow(date)) {
    dateString = `Tomorrow at ${format(date, "h:mm a")}`;
  } else if (isYesterday(date)) {
    dateString = `Yesterday at ${format(date, "h:mm a")}`;
  } else if (isThisWeek(date, { weekStartsOn: 1 })) {
    dateString = `${format(date, "EEEE")} at ${format(date, "h:mm a")}`;
  } else {
    dateString = format(date, "MMM d, yyyy • h:mm a");
  }

  if (duration) {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    let durationString = "• ";
    if (hours > 0) durationString += `${hours}h `;
    if (minutes > 0 || hours === 0) durationString += `${minutes}m`;

    return `${dateString} ${durationString.trim()}`;
  }

  return dateString;
};

export function determineExamType(visibility: string) {
  if (visibility === "public") return "Public Test";
  if (visibility === "private") return "Self Test";
  return "Group Test";
}

export function getExamTypeBadgeColor(visibility: string) {
  if (visibility === "public") return "bg-green-600 text-white";
  if (visibility === "private") return "bg-yellow-500 text-black";
  return "bg-rose-600 text-white";
}
