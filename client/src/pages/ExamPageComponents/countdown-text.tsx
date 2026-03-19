import { differenceInSeconds } from "date-fns";
import { useEffect, useState } from "react";

function formatDuration(seconds: number) {
  if (seconds <= 0) return "00:00:00";
  const days = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  return `${days > 0 ? `${days}d ` : ""}${hours
    .toString()
    .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function useRemainingSeconds(untilThisTime: Date) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    differenceInSeconds(untilThisTime, new Date()),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const secondsLeft = differenceInSeconds(untilThisTime, new Date());
      setRemainingSeconds(secondsLeft);
      if (secondsLeft <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [untilThisTime]);

  return remainingSeconds;
}

export function CountdownText({ until }: { until: Date }) {
  const remainingSeconds = useRemainingSeconds(until);
  return (
    <span className="font-display font-semibold">
      {formatDuration(remainingSeconds)}
    </span>
  );
}
