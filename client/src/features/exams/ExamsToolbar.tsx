import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ExamsToolbar({
  initialSearch = "",
  onSearch,
}: {
  initialSearch?: string;
  onSearch: (q: string) => void;
}) {
  const [q, setQ] = useState(initialSearch);
  const debounced = useDebounced(q, 300);

  useEffect(() => {
    onSearch(debounced.trim());
  }, [debounced, onSearch]);

  return (
    <div className="mb-4 flex items-center">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search exams or set name"
        aria-label="Search exams"
        className="w-full max-w-md"
      />
    </div>
  );
}
