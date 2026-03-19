import type { User } from "./types";

export const getInitials = (name?: string | null) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
};

export const isValidEmailFormat = (email: string) =>
  /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);

export const isValidEmailForAccessList = (email: string, users: User[]) => {
  for (const user of users) {
    if (user.email === email) return false;
  }

  return isValidEmailFormat(email);
};
