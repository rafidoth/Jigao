import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useCreateExamStore } from "./store";
import {
  combineDateTime,
  splitLocalDateTime,
  todayForDateInput,
} from "./utils";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="block text-sm font-medium mb-1">{children}</span>;
}

export function TitleField() {
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

export function DescriptionField() {
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

export function StartTimeField() {
  const startTimeLocal = useCreateExamStore((s) => s.startTimeLocal);
  const setStartTimeLocal = useCreateExamStore((s) => s.setStartTimeLocal);
  const { date, time } = splitLocalDateTime(startTimeLocal);
  const minDate = todayForDateInput();

  const selectedDate = date ? new Date(`${date}T00:00:00`) : undefined;
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
                fromDate={new Date(`${minDate}T00:00:00`)}
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
              setStartTimeLocal(combineDateTime(date || minDate, e.target.value))
            }
          />
          <span className="text-xs text-muted-foreground">Local timezone</span>
        </div>
      </div>
    </div>
  );
}

export function DurationField() {
  const durationInMinutes = useCreateExamStore((s) => s.durationInMinutes);
  const setDurationInMinutes = useCreateExamStore((s) => s.setDurationInMinutes);

  const presets = [30, 60, 90];

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
