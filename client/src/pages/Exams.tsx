import { useCallback, useState } from "react";
import ExamsToolbar from "@/features/exams/ExamsToolbar";
import ExamList from "@/features/exams/ExamList";
import { useExams } from "@/features/exams/useExams";
import { ScrollArea } from "@/components/ui/scroll-area";

function Exams() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = useExams();

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
  }, []);

  return (
    <div className="h-full w-full flex flex-col px-3 lg:px-9 py-3 font-bold">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Exams</h1>
      </div>
      <ExamsToolbar initialSearch={search} onSearch={handleSearch} />
      <div className="flex-1 pr-2 w-full">
        <ScrollArea className="rounded-md border h-96 h-[calc(100vh-100px)] w-full">
          <ExamList
            exams={data
              ?.filter(
                (exam) =>
                  exam.title.toLowerCase().includes(search.toLowerCase()) ||
                  exam.set?.title?.toLowerCase().includes(search.toLowerCase()),
              )
              .sort(
                (a, b) =>
                  new Date(b.start_time).getTime() -
                  new Date(a.start_time).getTime(),
              )}
            isLoading={isLoading}
            isError={isError}
            errorMessage={(error as any)?.message}
          />
        </ScrollArea>
      </div>
    </div>
  );
}
export default Exams;
