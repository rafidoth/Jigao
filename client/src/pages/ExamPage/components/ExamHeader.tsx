import { format } from "date-fns";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCountdown } from "../hooks/useCountdown";
import { useEndTime, useExamTitle, useIsConnected, useWarnings } from "../store/examStore";

interface ExamHeaderProps {
  onSubmit: () => void;
  answeredCount: number;
  totalQuestions: number;
}

/**
 * Header component for running exam.
 * Shows title, countdown timer, warnings, and submit button.
 */
function ExamHeader({ onSubmit, answeredCount, totalQuestions }: ExamHeaderProps) {
  const title = useExamTitle();
  const endTime = useEndTime();
  const isConnected = useIsConnected();
  const warnings = useWarnings();
  const countdown = useCountdown(endTime);

  const warningCount = warnings.length;

  return (
    <div
      className={cn(
        "flex justify-between items-center shrink-0 sticky top-0 z-10",
        "border rounded-md p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      )}
    >
      {/* Left: Title and badges */}
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">{title || "Exam"}</div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-semibold select-none bg-blue-500/20 text-blue-500"
          >
            Exam in progress
          </Badge>
          {isConnected ? (
            <Badge variant="outline" className="gap-1 text-green-600">
              <Wifi className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" />
              Disconnected
            </Badge>
          )}
        </div>
        {warningCount > 0 && (
          <Badge
            variant="outline"
            className="font-semibold select-none bg-yellow-500/20 text-yellow-600 gap-1 w-fit"
          >
            <AlertTriangle className="h-3 w-3" />
            {warningCount} warning{warningCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Center: Progress */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-muted-foreground">Progress</span>
        <span className="font-mono text-sm">
          {answeredCount} / {totalQuestions} answered
        </span>
      </div>

      {/* Right: Countdown and submit */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-xs text-muted-foreground">Time remaining</div>
          <div
            className={cn(
              "font-mono text-lg font-semibold",
              countdown.totalMs < 5 * 60 * 1000 && "text-red-500",
              countdown.totalMs < 1 * 60 * 1000 && "animate-pulse",
            )}
          >
            {countdown.formatted}
          </div>
          {endTime && (
            <div className="border flex gap-x-2 px-2 rounded-md bg-red-800/20 text-red-500 text-xs font-semibold">
              <span>{format(endTime, "d MMM")}</span>
              <span>{format(endTime, "p")}</span>
            </div>
          )}
        </div>
        <Button variant="destructive" onClick={onSubmit}>
          Submit Exam
        </Button>
      </div>
    </div>
  );
}

export default ExamHeader;
