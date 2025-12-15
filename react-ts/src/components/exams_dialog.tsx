import { useState, useEffect } from "react";
import { create } from "zustand";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { isToday, isTomorrow, isYesterday, isThisWeek, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowUpRight as ArrowTopRightIcon,
  RotateCcw,
  Trash,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { AreYouSure } from "@/components/AreYouSure";
import { Scrollbar } from "@radix-ui/react-scroll-area";

interface CreateExamStoreState {
  reset: () => void;
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  startTimeLocal: string; // datetime-local value
  setStartTimeLocal: (v: string) => void;
  durationInMinutes: number;
  setDurationInMinutes: (m: number) => void;
}

const CreateExamStore = (
  set: any,
  _get: any,
  store: any,
): CreateExamStoreState => ({
  reset: () => set(store.getInitialState()),
  title: "Untitled Exam",
  setTitle: (t) => set({ title: t }),
  description: "",
  setDescription: (d) => set({ description: d }),
  startTimeLocal: "",
  setStartTimeLocal: (v) => set({ startTimeLocal: v }),
  durationInMinutes: 60,
  setDurationInMinutes: (m) => set({ durationInMinutes: m }),
});

const useCreateExamStore = create(CreateExamStore);

function Label({ children }: { children: React.ReactNode }) {
  return <span className="block text-sm font-medium mb-1">{children}</span>;
}

function TitleField() {
  const title = useCreateExamStore((s) => s.title);
  const setTitle = useCreateExamStore((s) => s.setTitle);
  return (
    <label className="flex flex-col">
      <Label>Exam Title</Label>
      <Input
        placeholder="Enter exam title"
        value={title}
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
      />
    </label>
  );
}

function DescriptionField() {
  const description = useCreateExamStore((s) => s.description);
  const setDescription = useCreateExamStore((s) => s.setDescription);
  return (
    <label className="flex flex-col">
      <Label>Description</Label>
      <Textarea
        placeholder="Optional description for participants"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[90px]"
      />
    </label>
  );
}

function nowLocalForInput(offsetMinutes: number = 0) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + offsetMinutes);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function splitLocalDateTime(localValue: string) {
  if (!localValue) return { date: "", time: "" };
  const [date, time] = localValue.split("T");
  return { date, time: (time ?? "").slice(0, 5) };
}

function combineDateTime(date: string, time: string) {
  if (!date) return "";
  const t = (time || "00:00").slice(0, 5);
  return `${date}T${t}`;
}

function todayForDateInput() {
  return nowLocalForInput().slice(0, 10);
}

function StartTimeField() {
  const startTimeLocal = useCreateExamStore((s) => s.startTimeLocal);
  const setStartTimeLocal = useCreateExamStore((s) => s.setStartTimeLocal);
  const { date, time } = splitLocalDateTime(startTimeLocal);
  const minDate = todayForDateInput();

  const selectedDate = date ? new Date(date + "T00:00:00") : undefined;
  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString()
    : "Pick a date";

  return (
    <div className="flex flex-col">
      <Label>Start Date & Time</Label>
      <div className="flex gap-4">
        <div className="md:col-span-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>{displayDate}</span>
                <span className="text-muted-foreground">Change</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d: Date | undefined) => {
                  if (!d) return;
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  const newDate = `${y}-${m}-${day}`;
                  setStartTimeLocal(combineDateTime(newDate, time));
                }}
                fromDate={new Date(minDate + "T00:00:00")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col gap-2">
          <Input
            type="time"
            value={time}
            step={60}
            onChange={(e) =>
              setStartTimeLocal(
                combineDateTime(date || minDate, e.target.value),
              )
            }
          />
          <span className="text-xs text-muted-foreground">Local timezone</span>
        </div>
      </div>
    </div>
  );
}

function DurationField() {
  const durationInMinutes = useCreateExamStore((s) => s.durationInMinutes);
  const setDurationInMinutes = useCreateExamStore(
    (s) => s.setDurationInMinutes,
  );

  // Minimal common presets
  const presets: number[] = [30, 60, 90];

  const handleInput = (value: string) => {
    const v = parseInt(value || "0", 10);
    setDurationInMinutes(Number.isNaN(v) ? 0 : Math.max(1, v));
  };

  const increment = (delta: number) => {
    setDurationInMinutes(Math.max(1, durationInMinutes + delta));
  };

  return (
    <div className="flex flex-col">
      <Label>Duration (minutes)</Label>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => increment(-5)}
            aria-label="Decrease duration by five minutes"
          >
            -5
          </Button>
          <Input
            min={1}
            step={5}
            value={String(durationInMinutes)}
            onChange={(e) => handleInput(e.target.value)}
            className="w-24 text-center"
            aria-label="Duration in minutes"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => increment(5)}
            aria-label="Increase duration by five minutes"
          >
            +5
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={p === durationInMinutes ? "default" : "outline"}
              onClick={() => setDurationInMinutes(p)}
              className="text-xs"
              aria-label={`Set duration to ${p} minutes`}
            >
              {p >= 60
                ? `${Math.floor(p / 60)}h${p % 60 ? ` ${p % 60}m` : ""}`
                : `${p}m`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function toISOFromLocal(localValue: string) {
  if (!localValue) return "";
  return new Date(localValue).toISOString();
}

function validateExamInputs(
  title: string,
  startTimeLocal: string,
  durationInMinutes: number,
) {
  let error = "";
  if (!title || title.trim() === "") error = "Title is required";
  else if (!startTimeLocal) error = "Start time is required";
  else if (new Date(startTimeLocal) <= new Date())
    error = "Start time must be in the future";
  else if (!durationInMinutes || durationInMinutes <= 0)
    error = "Duration must be greater than 0";
  return { error, isError: error !== "" };
}
const formatDateFriendly = (date: Date, duration?: number) => {
  let dateString = "";

  if (isToday(date)) {
    dateString = `Today at ${format(date, "h:mm a")}`;
  } else if (isTomorrow(date)) {
    dateString = `Tomorrow at ${format(date, "h:mm a")}`;
  } else if (isYesterday(date)) {
    dateString = `Yesterday at ${format(date, "h:mm a")}`;
  } else if (isThisWeek(date, { weekStartsOn: 1 })) {
    dateString = `${format(date, "EEEE")} at ${format(date, "h:mm a")}`;
  } else {
    dateString = format(date, "MMM d, yyyy • h:mm a");
  }

  if (duration) {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    let durationString = "• ";
    if (hours > 0) {
      durationString += `${hours}h `;
    }
    if (minutes > 0 || hours === 0) {
      durationString += `${minutes}m`;
    }
    return `${dateString} ${durationString.trim()}`;
  }

  return dateString;
};

async function createExamApiPost(variables: any) {
  const { set_id, title, description, start_time_iso, duration_in_minutes } =
    variables;
  const body = {
    set_id,
    title,
    description,
    start_time: start_time_iso,
    duration_in_minutes,
  };
  const res = await axios.post(`http://localhost:9999/api/v1/exams`, body);
  return res.data;
}

async function fetchExamsApi(set_id: string) {
  const res = await axios.get(`/api/v1/exams`, { params: { set_id } });
  return res.data;
}

async function deleteExamApi(exam_id: string) {
  await axios.delete(`/api/v1/exams/${exam_id}`);
  return { exam_id };
}

function determineExamType(visibility: string) {
  if (visibility === "public") return "Public Test";
  else if (visibility === "private") return "Self Test";
  else return "Group Test";
}

function getExamTypeBadgeColor(visibility: string) {
  if (visibility === "public") return "bg-green-600 text-white";
  else if (visibility === "private") return "bg-yellow-500 text-black";
  else return "bg-rose-600 text-white";
}

function ExamsList({ set_id }: { set_id: string }) {
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
  if (isError)
    return <p className="text-sm text-destructive">Failed to load exams.</p>;

  const exams = Array.isArray(data) ? data : [];
  if (exams.length === 0) {
    return (
      <div className="flex flex-col gap-3 items-center py-10">
        <Button className="w-[100px]" variant="ghost" onClick={() => refetch()}>
          <RotateCcw />
        </Button>
        <p className="text-3xl text-muted-foreground">
          No exams found for this set.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <Scrollbar orientation="vertical" />
      <div className="flex flex-col gap-3">
        {exams.map((xm: any) => {
          const { exam, created_by } = xm;
          const startTime = exam.start_time;
          const start = startTime ? new Date(startTime) : null;
          const isPast = start ? start < new Date() : false;
          const duration = xm.duration_in_minutes;
          const xmType = determineExamType(exam.visibility);
          const isOngoing =
            start &&
            !isPast &&
            start <= new Date() &&
            duration &&
            new Date(start.getTime() + duration * 60000) > new Date();

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
                      {formatDateFriendly(start!, duration)}
                    </div>

                    <div
                      className={`text-sm font-semibold ${getExamTypeBadgeColor(exam.visibility)} w-fit px-2 rounded-md mb-1`}
                    >
                      {xmType}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-2xl font-bold">
                      {exam.title}
                    </span>
                    <Badge
                      variant={isPast ? "secondary" : "default"}
                      className="text-sm"
                    >
                      {isPast ? (isOngoing ? "On Going" : "Past") : "Upcoming"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-x-2 my-2">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={created_by.image_url} />
                      <AvatarFallback>
                        {created_by.name?.charAt(0)}{" "}
                        {created_by.name?.charAt(1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">created by</span>
                      <span className="text-lg">{created_by.name}</span>
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
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      Open <ArrowTopRightIcon className="h-4 w-4" />
                    </Button>
                  </a>
                  <AreYouSure
                    mutateAsync={() => deleteExam(exam.id)}
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
        })}
      </div>
    </ScrollArea>
  );
}

export default function ExamsDialog({
  children,
  set_id,
}: {
  children: React.ReactNode;
  set_id: string;
}) {
  const [open, setOpen] = useState(false);
  const title = useCreateExamStore((s) => s.title);
  const description = useCreateExamStore((s) => s.description);
  const startTimeLocal = useCreateExamStore((s) => s.startTimeLocal);
  const durationInMinutes = useCreateExamStore((s) => s.durationInMinutes);
  const reset = useCreateExamStore((s) => s.reset);

  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  // Provide a default start time slightly in the future when dialog opens
  useEffect(() => {
    if (open && !startTimeLocal) {
      useCreateExamStore.getState().setStartTimeLocal(nowLocalForInput(10));
    }
  }, [open, startTimeLocal]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createExamApiPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", set_id] });
      reset();
      setError("");
      setOpen(false);
    },
    onError: () => setError("Failed to create exam. Please try again."),
  });

  const handleCreateExam = async () => {
    const { error, isError } = validateExamInputs(
      title,
      startTimeLocal,
      durationInMinutes,
    );
    if (isError) {
      setError(error);
      return;
    }
    setError("");
    try {
      await mutateAsync({
        set_id,
        title,
        description,
        start_time_iso: toISOFromLocal(startTimeLocal),
        duration_in_minutes: durationInMinutes,
      });
    } catch (error) {
      console.error(error);
      setError("Failed to create exam. Please try again.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-[92vw] sm:max-w-xl md:max-w-2xl p-3"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="text-3xl">Exams</SheetTitle>
          <SheetDescription className="text-lg">
            Create new exam and review scheduled exams for this set.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6">
          <div>
            <Dialog>
              <DialogTrigger>
                <Button
                  className="font-display cursor-pointer font-bold"
                  variant="secondary"
                >
                  Create New Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[800px]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Create Exam</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure details and schedule a start time.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-4">
                  <div className="sm:col-span-2">
                    <TitleField />
                  </div>
                  <div className="sm:col-span-2">
                    <DescriptionField />
                  </div>
                  <StartTimeField />
                  <DurationField />
                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {error && (
                    <Alert variant="destructive" className="sm:max-w-xs">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="ml-auto flex gap-3">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateExam} disabled={isPending}>
                      {isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1">Scheduled Exams</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Review upcoming and past exams.
            </p>
            <ExamsList set_id={set_id} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
