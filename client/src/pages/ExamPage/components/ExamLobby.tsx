import { format } from "date-fns";
import { Globe, ShieldCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { useCountdown } from "../hooks/useCountdown";
import { useExamTitle, useExamVisibility, useStartTime } from "../store/examStore";
import type { ExamVisibility } from "../types";

/**
 * Visibility-specific content for the lobby.
 */
function VisibilityBanner({ visibility }: { visibility: ExamVisibility }) {
  if (visibility === "public") {
    return (
      <div className="w-full max-w-2xl rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-sm text-sky-600 dark:text-sky-400 flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Public exam lobby is open. Keep this tab active until the session starts.
      </div>
    );
  }

  if (visibility === "protected") {
    return (
      <div className="w-full max-w-2xl rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" />
        Protected exam lobby is active. Please remain connected for monitoring.
      </div>
    );
  }

  // Friendly (private)
  return (
    <div className="w-full max-w-2xl rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
      <Users className="h-4 w-4" />
      Welcome to the exam lobby. The exam will begin shortly.
    </div>
  );
}

/**
 * Get the lobby label based on visibility.
 */
function getLobbyLabel(visibility: ExamVisibility): string {
  switch (visibility) {
    case "public":
      return "Public exam lobby";
    case "protected":
      return "Protected exam lobby";
    case "friendly":
    default:
      return "Exam lobby";
  }
}

/**
 * Waiting room component displayed before exam starts.
 * Shows countdown timer and visibility-specific messaging.
 */
function ExamLobby() {
  const title = useExamTitle();
  const startTime = useStartTime();
  const visibility = useExamVisibility();
  const countdown = useCountdown(startTime);

  return (
    <div className="h-screen w-full flex flex-col justify-center items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">{title || "Exam"}</h1>

      <VisibilityBanner visibility={visibility} />

      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="font-semibold">{getLobbyLabel(visibility)}</p>
              {startTime && (
                <div className="border flex gap-x-2 px-2 py-1 rounded-md bg-blue-800/20 text-blue-500 dark:text-blue-400 text-sm font-semibold">
                  <span>{format(startTime, "d MMMM, yyyy")}</span>
                  <span>{format(startTime, "p")}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center gap-1">
              <div className="text-xs text-muted-foreground">Starts in</div>
              <div className="font-mono text-2xl font-semibold">{countdown.formatted}</div>
              {countdown.isExpired && (
                <Badge variant="secondary" className="animate-pulse">
                  Starting soon...
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center max-w-md">
        Please stay on this page. The exam will automatically begin when the start time is reached.
      </p>
    </div>
  );
}

export default ExamLobby;
