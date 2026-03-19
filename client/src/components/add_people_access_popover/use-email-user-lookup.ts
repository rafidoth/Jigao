import { useEffect, useMemo, useState } from "react";
import { getUserFromEmail } from "./api";
import type { User } from "./types";
import { isValidEmailForAccessList } from "./utils";

type LookupResult = User | "not_found" | null;

export function useEmailUserLookup(users: User[]) {
  const [emailInput, setEmailInput] = useState("");
  const [userChecking, setUserChecking] = useState(false);
  const [foundUser, setFoundUser] = useState<LookupResult>(null);

  const isValidEmail = useMemo(
    () => (email: string) => isValidEmailForAccessList(email, users),
    [users],
  );

  useEffect(() => {
    const value = emailInput.trim();
    if (!value) {
      setFoundUser(null);
      return;
    }

    const handle = setTimeout(async () => {
      if (!isValidEmail(value)) {
        setFoundUser(null);
        return;
      }

      setUserChecking(true);
      try {
        const data = await getUserFromEmail(value);
        setFoundUser(data);
      } catch (e) {
        console.error(e);
        setFoundUser("not_found");
      } finally {
        setUserChecking(false);
      }
    }, 600);

    return () => clearTimeout(handle);
  }, [emailInput, isValidEmail]);

  const reset = () => {
    setEmailInput("");
    setFoundUser(null);
  };

  return {
    emailInput,
    setEmailInput,
    userChecking,
    foundUser,
    isValidEmail,
    reset,
  };
}
