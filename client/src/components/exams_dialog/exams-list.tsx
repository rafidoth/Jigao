import { Scrollbar } from "@radix-ui/react-scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight as ArrowTopRightIcon, RotateCcw, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AreYouSure } from "@/components/AreYouSure";
import { deleteExamApi, fetchExamsApi } from "./api";
import {
  determineExamType,
  formatDateFriendly,
  getExamTypeBadgeColor,
} from "./utils";
import type { ExamItem } from "./types";

interface ExamsListProps {
  set_id: string;
}

function ExamsListItem({
  exam,
  deleting,
  onDelete,
}: {
  exam: ExamItem;
  deleting: boolean;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const startTime = exam.start_time;
  const start = startTime ? new Date(startTime) : null;
  const duration = exam.duration;
  const now = new Date();
  const end = start && duration ? new Date(start.getTime() + duration * 60000) : null;
  const isOngoing = !!start && !!end && start <= now && end > now;
  const isPast = end ? end <= now : !!start && start < now;
  const xmType = determineExamType(exam.visibility);
  const ownerName = exam.owner_name ?? exam.created_by?.name ?? "Unknown";
  const ownerProfileImageUrl =
    exam.owner_profile_image_url ?? exam.created_by?.image_url ?? "";

  return (
    <Card
      key={exam.id ?? `${exam.set_id}-${exam.title}-${startTime}`}
      className={`transition-all hover:shadow-md ${
        isPast ? "bg-gray-500" : isOngoing ? "bg-blue-500/10" : ""
      }`}
    >
      <div className="flex items-center justify-between px-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div
              className={`text-sm font-bold ${getExamTypeBadgeColor(exam.visibility)} w-fit px-2 rounded-md mb-1`}
            >
              {start ? formatDateFriendly(start, duration) : "No start time"}
            </div>

            <div
              className={`text-sm font-semibold ${getExamTypeBadgeColor(exam.visibility)} w-fit px-2 rounded-md mb-1`}
            >
              {xmType}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg font-bold">{exam.title}</span>
            <Badge variant={isPast ? "secondary" : "default"} className="text-sm">
              {isPast ? (isOngoing ? "On Going" : "Past") : "Upcoming"}
            </Badge>
          </div>
          <div className="flex items-center gap-x-2 my-2">
            <Avatar className="w-12 h-12">
              <AvatarImage src={ownerProfileImageUrl} />
              <AvatarFallback>
                {ownerName.charAt(0)}
                {ownerName.charAt(1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-muted-foreground">created by</span>
              <span className="text-sm">{ownerName}</span>
            </div>
          </div>
          {exam.description && (
            <p className="text-xs text-muted-foreground line-clamp-3">
              {exam.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a href={`/exam/${exam.id}`} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm" className="flex items-center gap-1">
              Open <ArrowTopRightIcon className="h-4 w-4" />
            </Button>
          </a>
          <AreYouSure
            mutateAsync={() => (exam.id ? onDelete(exam.id) : Promise.resolve())}
            title="Delete Exam"
            description="This action cannot be undone."
            confirmLabel={deleting ? "Deleting..." : "Delete"}
            cancelLabel="Cancel"
          >
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              className="flex items-center gap-1"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </AreYouSure>
        </div>
      </div>
    </Card>
  );
}

export function ExamsList({ set_id }: ExamsListProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["exams", set_id],
    queryFn: () => fetchExamsApi(set_id),
  });

  const { mutateAsync: deleteExam, isPending: deleting } = useMutation({
    mutationFn: (exam_id: string) => deleteExamApi(exam_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", set_id] });
    },
  });

  if (isLoading) return <p className="text-sm">Loading exams…</p>;
  if (isError) return <p className="text-sm text-destructive">Failed to load exams.</p>;

  const exams: ExamItem[] = Array.isArray(data) ? data : [];
  if (exams.length === 0) {
    return (
      <div className="flex flex-col gap-3 items-center py-10">
        <Button className="w-[100px]" variant="ghost" onClick={() => refetch()}>
          <RotateCcw />
        </Button>
        <p className="text-xl text-muted-foreground">No exams found for this set.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <Scrollbar orientation="vertical" />
      <div className="flex flex-col gap-3">
        {exams.map((exam) => (
          <ExamsListItem
            key={exam.id ?? `${exam.set_id}-${exam.title}-${exam.start_time}`}
            exam={exam}
            deleting={deleting}
            onDelete={deleteExam}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
