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
    <div className="h-full flex flex-col px-3 lg:px-9 py-3">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Exams</h1>
      </div>
      <ExamsToolbar initialSearch={search} onSearch={handleSearch} />
      <div className="flex-1 pr-2">
        <ScrollArea className="h-full">
          <ExamList
            exams={data}
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
