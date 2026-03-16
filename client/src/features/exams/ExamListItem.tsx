import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { Exam } from "./types";
import { getExamAction, isEnded, isRunning, isUpcoming } from "./helper";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Clock, FileText } from "lucide-react";

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
export default function ExamListItem({ exam }: { exam: Exam }) {
  const action = getExamAction(exam);
  const upcoming = isUpcoming(exam);
  const running = isRunning(exam);
  const ended = isEnded(exam);

  const start = format(new Date(exam.start_time), "dd MMM, yyyy h:mm a");
  const end = format(new Date(exam.end_time), "dd MMM, yyyy h:mm a");
  const setTitle = exam.set?.title ? exam.set.title : "";

  return (
    <div className="w-full flex items-start justify-between p-5 border-b hover:bg-muted/50 transition-colors">
      <div className="flex-1 space-y-3">
        <div className="flex gap-x-2 text-base items-center">
          <span className="font-semibold  leading-tight">{exam.title}</span>
          {setTitle && (
            <span className="flex items-center  gap-x-2 bg-primary/20 text-primary-foreground/80 px-3 py-1 rounded-full ">
              On
              <FileText className="h-5 w-5 " />
              <span>{setTitle}</span>
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-md text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {start} to {end}
            </span>
          </div>
          <div className="flex items-center gap-2 text-md text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Duration: {formatDuration(exam.duration)}</span>
          </div>
        </div>

        {/* Badges */}
        {(upcoming || running || ended) && (
          <div className="flex gap-2">
            {upcoming && <Badge variant="secondary">Upcoming</Badge>}
            {running && (
              <Badge className="bg-green-600 hover:bg-green-700">Running</Badge>
            )}
            {ended && <Badge variant="destructive">Ended</Badge>}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="ml-4 flex-shrink-0">
        {action && (
          <Button asChild size="sm">
            <Link
              to={action.to}
              aria-label={`${action.label} exam ${exam.title}`}
            >
              {action.label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
