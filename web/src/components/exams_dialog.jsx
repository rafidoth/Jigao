import React, { useState } from "react";
import {
  Flex,
  TextField,
  Text,
  Button,
  Dialog,
  Tabs,
  Box,
  TextArea,
  Badge,
  Card,
  ScrollArea,
} from "@radix-ui/themes";
import { CalendarIcon, ArrowTopRightIcon } from "@radix-ui/react-icons";
import { create } from "zustand";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { rootDomain } from "../api/api";

// Local store for create-exam dialog state
const CreateExamStore = (set, get, store) => ({
  reset: () => set(store.getInitialState()),
  title: "",
  setTitle: (t) => set({ title: t }),
  description: "",
  setDescription: (d) => set({ description: d }),
  // HTML input type datetime-local value (e.g., 2025-10-12T14:30)
  startTimeLocal: "",
  setStartTimeLocal: (v) => set({ startTimeLocal: v }),
  durationInMinutes: 60,
  setDurationInMinutes: (m) => set({ durationInMinutes: m }),
});

const useCreateExamStore = create(CreateExamStore);

function TitleField() {
  const title = useCreateExamStore((s) => s.title);
  const setTitle = useCreateExamStore((s) => s.setTitle);
  return (
    <label>
      <Text as="div" size="2" mb="1" weight="bold">
        Exam Title
      </Text>
      <TextField.Root
        placeholder="Enter exam title"
        radius="medium"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
    </label>
  );
}

function DescriptionField() {
  const description = useCreateExamStore((s) => s.description);
  const setDescription = useCreateExamStore((s) => s.setDescription);
  return (
    <label>
      <Text as="div" size="2" mb="1" weight="bold">
        Description
      </Text>
      <TextArea
        placeholder="Optional description for participants"
        radius="medium"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </label>
  );
}

function nowLocalForInput() {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function StartTimeField() {
  const startTimeLocal = useCreateExamStore((s) => s.startTimeLocal);
  const setStartTimeLocal = useCreateExamStore((s) => s.setStartTimeLocal);
  const minValue = nowLocalForInput();
  return (
    <label>
      <Text as="div" size="2" mb="1" weight="bold">
        Start Time
      </Text>
      <TextField.Root
        type="datetime-local"
        radius="medium"
        value={startTimeLocal}
        min={minValue}
        step="60"
        onChange={(e) => setStartTimeLocal(e.target.value)}
      >
        <TextField.Slot px="3">
          <CalendarIcon width="16" height="16" />
        </TextField.Slot>
      </TextField.Root>
      <Text size="1" color="gray">
        Times use your local timezone
      </Text>
    </label>
  );
}

function DurationField() {
  const durationInMinutes = useCreateExamStore((s) => s.durationInMinutes);
  const setDurationInMinutes = useCreateExamStore(
    (s) => s.setDurationInMinutes,
  );
  return (
    <label>
      <Text as="div" size="2" mb="1" weight="bold">
        Duration (minutes)
      </Text>
      <TextField.Root
        type="number"
        radius="medium"
        min="1"
        step="1"
        value={String(durationInMinutes)}
        onChange={(e) => {
          const v = parseInt(e.target.value || "0", 10);
          setDurationInMinutes(Number.isNaN(v) ? 0 : v);
        }}
      />
    </label>
  );
}

function toISOFromLocal(localValue) {
  if (!localValue) return "";
  // Interpret local datetime as local time and convert to ISO 8601
  return new Date(localValue).toISOString();
}

function validateExamInputs(title, startTimeLocal, durationInMinutes) {
  let error = "";
  if (!title || title.trim() === "") {
    error = "Title is required";
  } else if (!startTimeLocal) {
    error = "Start time is required";
  } else if (new Date(startTimeLocal) <= new Date()) {
    error = "Start time must be in the future";
  } else if (!durationInMinutes || durationInMinutes <= 0) {
    error = "Duration must be greater than 0";
  }
  return { error, isError: error !== "" };
}

async function createExamApiPost(variables) {
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

async function fetchExamsApi(set_id) {
  const res = await axios.get(`${rootDomain}/api/v1/exams`, {
    params: { set_id },
  });
  return res.data;
}

function ExamsList({ set_id }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["exams", set_id],
    queryFn: () => fetchExamsApi(set_id),
  });

  if (isLoading) return <Text size="2">Loading exams…</Text>;
  if (isError)
    return (
      <Text size="2" color="red">
        Failed to load exams.
      </Text>
    );

  const exams = Array.isArray(data) ? data : [];
  if (exams.length === 0) {
    return (
      <Flex direction="column" gap="3">
        <Text size="2" color="gray">
          No exams yet for this set.
        </Text>
        <Button variant="soft" onClick={() => refetch()}>
          Refresh
        </Button>
      </Flex>
    );
  }

  return (
    <ScrollArea type="always" scrollbars="vertical" style={{ height: 400 }}>
      <Flex direction="column" gap="3" mr={"5"}>
        {exams.map((exam) => {
          const startTime = exam.start_time;
          const start = startTime ? new Date(startTime) : null;
          const isPast = start ? start < new Date() : false;
          const duration = exam.duration_in_minutes;
          return (
            <Card
              key={exam.id ?? `${exam.set_id}-${exam.title}-${startTime}`}
              vari
            >
              <Flex
                justify="between"
                align="center"
                style={{ opacity: isPast ? 0.65 : 1 }}
              >
                <Flex direction="column">
                  <Flex direction="row" gap="1">
                    <Text weight="bold">{exam.title}</Text>

                    <Badge variant="soft" color={isPast ? "gray" : "green"}>
                      {isPast ? "Past" : "Upcoming"}
                    </Badge>
                  </Flex>

                  <Text size="2" color="gray">
                    {start.toLocaleString()}{" "}
                    {duration ? `• ${duration} min` : ""}
                  </Text>

                  {exam.description && (
                    <Text size="2" color="gray">
                      {exam.description}
                    </Text>
                  )}
                </Flex>
                <Flex>
                  <a href={`/exam/${exam.id}`} target="_blank" rel="noreferrer">
                    <Button radius="medium" variant="soft">
                      Open
                      <ArrowTopRightIcon />
                    </Button>
                  </a>
                </Flex>
              </Flex>
            </Card>
          );
        })}
      </Flex>
    </ScrollArea>
  );
}

function ExamsDialog({ children, set_id }) {
  const [open, setOpen] = useState(false);
  const title = useCreateExamStore((s) => s.title);
  const description = useCreateExamStore((s) => s.description);
  const startTimeLocal = useCreateExamStore((s) => s.startTimeLocal);
  const durationInMinutes = useCreateExamStore((s) => s.durationInMinutes);
  const reset = useCreateExamStore((s) => s.reset);

  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createExamApiPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", set_id] });
      reset();
      setError("");
      setOpen(false);
    },
    onError: () => {
      setError("Failed to create exam. Please try again.");
    },
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
      // Handled in onError
      console.log(error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>{children}</Dialog.Trigger>

      <Dialog.Content maxWidth="560px">
        <Tabs.Root defaultValue="create-new">
          <Tabs.List>
            <Tabs.Trigger value="create-new">Create New Exam</Tabs.Trigger>
            <Tabs.Trigger value="existing">Exams</Tabs.Trigger>
          </Tabs.List>

          <Box pt="3">
            <Tabs.Content value="create-new">
              <Dialog.Title></Dialog.Title>
              <Dialog.Description size="2" mb="5">
                Schedule an exam for this set.
              </Dialog.Description>

              <Flex direction="column" gap="4">
                <TitleField />
                <DescriptionField />
                <StartTimeField />
                <DurationField />
              </Flex>

              <Flex gap="3" mt="5" justify="between" align="center">
                <Text color="red">{error}</Text>
                <Flex gap="3">
                  <Button
                    variant="soft"
                    color="gray"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateExam}
                    disabled={isPending}
                    variant="soft"
                  >
                    {isPending ? "Creating..." : "Create"}
                  </Button>
                </Flex>
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="existing">
              <ExamsList set_id={set_id} />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export default ExamsDialog;
