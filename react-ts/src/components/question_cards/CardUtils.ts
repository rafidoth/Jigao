export function difficultyColor(d: string) {
  const key = String(d || "").toLowerCase();
  if (key === "easy") return "green";
  if (key === "medium") return "amber";
  if (key === "hard") return "ruby";
  return "gray";
}

export function typeLabel(t: string) {
  return String(t || "")
    .replaceAll("_", " ")
    .replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}
