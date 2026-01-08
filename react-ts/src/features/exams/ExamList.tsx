import type { Exam } from "./types";
import ExamListItem from "./ExamListItem";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ExamList({
  exams,
  isLoading,
  isError,
  errorMessage,
}: {
  exams: Exam[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}) {
  console.log("exams fetched ", exams);
  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-sm text-red-500">
        Failed to load exams{errorMessage ? `: ${errorMessage}` : "."}
      </div>
    );
  }

  if (!exams || exams.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">No exams found.</div>
    );
  }

  return (
    <ScrollArea className="rounded-md border h-96 h-[calc(100vh-100px)]">
      {exams.map((e) => (
        <ExamListItem key={e.id} exam={e} />
      ))}
    </ScrollArea>
  );
}
