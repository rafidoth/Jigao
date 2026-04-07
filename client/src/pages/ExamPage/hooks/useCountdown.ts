import { useEffect, useMemo, useState } from "react";

interface CountdownResult {
  /** Formatted countdown string (e.g., "2d 5h 30m 15s") */
  formatted: string;
  /** Total remaining milliseconds */
  totalMs: number;
  /** Individual time components */
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Whether the countdown has finished */
  isExpired: boolean;
}

/**
 * Hook that provides a countdown to a target date.
 * Updates every second while countdown is active.
 */
export function useCountdown(targetDate: Date | null): CountdownResult {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetDate) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return useMemo(() => {
    if (!targetDate) {
      return {
        formatted: "--:--:--",
        totalMs: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      return {
        formatted: "00:00:00",
        totalMs: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    // Format based on remaining time
    let formatted: string;
    if (days > 0) {
      formatted = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return {
      formatted,
      totalMs: diff,
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
    };
  }, [now, targetDate]);
}

/**
 * Simple countdown text component
 */
export function formatCountdown(targetDate: Date | null): string {
  if (!targetDate) return "--:--:--";

  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return "00:00:00";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
