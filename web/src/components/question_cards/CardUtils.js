export function difficultyColor(d) {
  const key = String(d || "").toLowerCase();
  if (key === "easy") return "green";
  if (key === "medium") return "amber";
  if (key === "hard") return "ruby";
  return "gray";
}

export function typeLabel(t) {
  return String(t || "")
    .replaceAll("_", " ")
    .replace(/^\w|\s\w/g, (m) => m.toUpperCase());
}
