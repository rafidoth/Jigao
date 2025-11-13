import { useParams } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import axios from "axios";
import {
  Globe2 as GlobeIcon,
  Lock as LockClosedIcon,
  Eye as EyeOpenIcon,
  Settings as GearIcon,
  Plus as PlusIcon,
  Info as InfoIcon,
} from "lucide-react";

import useExistingSetStore from "../store/existingSetStore";
import QuestionCard from "../components/question_cards/question_card.tsx";
import CreateNewQuestionPopover from "../components/create_new_question_popover";
import ExamsDialog from "../components/exams_dialog.tsx";
import SetSettingsUpdatePopover from "../components/set_settings_update_popover.tsx";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { timeAgo } from "@/lib/utils";

function getVisibilityIcon(visibility: string) {
  switch (visibility) {
    case "public":
      return <GlobeIcon className="h-5 w-5" />;
    case "private":
      return <LockClosedIcon className="h-5 w-5" />;
    case "restricted":
      return <EyeOpenIcon className="h-5 w-5" />;
    default:
      return null;
  }
}

function ExistingSetHeader({
  set,
  itemsLength,
  showAnswer,
  toggleShowAnswer,
}: {
  set: any;
  itemsLength: number;
  showAnswer: boolean;
  toggleShowAnswer: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex flex-col gap-3 px-3 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight leading-tight break-words text-foreground">
                {set.title}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1">
                  {getVisibilityIcon(set.visibility)}
                  <span className="capitalize">{set.visibility}</span>
                </span>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {itemsLength} questions
                </Badge>
              </div>
              {set?.description && (
                <p className="mt-1 text-muted-foreground text-xs sm:text-sm truncate max-w-[80vw] sm:max-w-[50vw]">
                  {set.description}
                </p>
              )}
              {set?.updated_at && (
                <div className="mt-0.5 text-muted-foreground text-xs sm:text-sm">
                  Updated {timeAgo(set.updated_at)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SetSettingsUpdatePopover set={set}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label="Set settings"
              >
                <GearIcon className="h-5 w-5" />
              </Button>
            </SetSettingsUpdatePopover>
            <ExamsDialog set_id={set.id}>
              <Button
                variant="secondary"
                className="h-9 px-3 transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Manage Exams
              </Button>
            </ExamsDialog>
          </div>
        </div>

        {/* Action bar: switch, add question, questions badge (mobile visible) */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-2 border-t">
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center">
                    <Switch
                      checked={showAnswer}
                      onCheckedChange={toggleShowAnswer}
                      aria-label="Toggle show answers"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">Toggle Show Answer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <CreateNewQuestionPopover set_id={set.id}>
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9"
                aria-label="Add question"
              >
                <PlusIcon className="h-5 w-5" />
              </Button>
            </CreateNewQuestionPopover>
            <Badge variant="secondary" className="sm:hidden">
              {itemsLength} questions
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionsList({ items }: { items: any[] }) {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const handleSelectingAnswer = (qId: string, ans: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: ans,
    }));
  };

  return (
    <ScrollArea className="h-[calc(100vh-100px)]">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 px-3">
        {items.map((q: any, i: number) => (
          <QuestionCard
            key={q.id}
            question={q}
            position={i + 1}
            selected={selectedAnswers[q.id] || ""}
            selectAnswer={handleSelectingAnswer}
          />
        ))}

        {items.length === 0 && (
          <Card className="p-4">
            <p className="text-muted-foreground">
              No questions in this set yet.
            </p>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

const getQuestions = async (set_id: string) => {
  const res = await axios.get(`/api/v1/questions?set_id=${set_id}`);
  return res.data;
};

const getSet = async (set_id: string) => {
  const res = await axios.get(`/api/v1/sets/${set_id}`);
  return res.data;
};

function LoadingExistingSet() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <InfoIcon className="h-5 w-5" />
          <p>Loading questions…</p>
        </div>
      </Card>
    </div>
  );
}

function ErrorExistingSet({ message }: { message?: string }) {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <Alert variant="destructive">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Error loading questions{message ? `: ${message}` : ""}
        </AlertDescription>
      </Alert>
    </div>
  );
}

function ExistingSet() {
  const { set_id } = useParams();

  const results = useQueries({
    queries: [
      { queryKey: ["set", set_id], queryFn: () => getSet(set_id as string) },
      {
        queryKey: ["questions", set_id],
        queryFn: () => getQuestions(set_id as string),
      },
    ],
  });

  const {
    data: set,
    isLoading: isSetLoading,
    isError: isSetError,
    error: setError,
  } = results[0] as any;
  const {
    data: questions,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
    error: questionsError,
  } = results[1] as any;

  const items = useMemo(() => questions || [], [questions]);
  const showAnswer = useExistingSetStore((state) => state.showAnswer);
  const toggleShowAnswer = useExistingSetStore(
    (state) => state.toggleShowAnswer,
  );

  if (isSetLoading || isQuestionsLoading) {
    return <LoadingExistingSet />;
  }

  if (isSetError || isQuestionsError) {
    const message =
      (setError as any)?.message || (questionsError as any)?.message || "";
    return <ErrorExistingSet message={message} />;
  }

  return (
    <div className="flex flex-row flex-1 gap-4 justify-center">
      <div className="flex flex-col gap-4 w-full">
        <ExistingSetHeader
          set={set}
          itemsLength={items.length}
          showAnswer={showAnswer}
          toggleShowAnswer={toggleShowAnswer}
        />
        <QuestionsList items={items} />
      </div>
    </div>
  );
}

export default ExistingSet;
