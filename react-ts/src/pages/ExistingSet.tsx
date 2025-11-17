import { useNavigate, useParams } from "react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getSet, getQuestions } from "@/api/api.ts";
import {
  Globe2 as GlobeIcon,
  Lock as LockClosedIcon,
  Eye as EyeOpenIcon,
  Settings as GearIcon,
  Plus as PlusIcon,
  Info as InfoIcon,
  ArrowLeft,
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
import { Skeleton } from "@/components/ui/skeleton";

import AddPeopleAccessPopover from "@/components/add_people_access_popover.tsx";
import { getUsersWithAccess } from "@/api/api.ts";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";

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

interface User {
  id: string | number;
  name: string;
  email: string;
  image_url?: string | null;
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
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["usersWithAccess", set.id],
    queryFn: () => getUsersWithAccess(set.id),
  });

  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex flex-col gap-3 px-3 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex flex-col">
              <div className="flex align-center gap-x-2">
                <Button
                  variant="outline"
                  className="h-9 w-9 rounded-full transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft />
                </Button>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight leading-tight break-words text-foreground font-serif">
                  {set.title}
                </h1>
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
              </div>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1">
                  {getVisibilityIcon(set.visibility)}
                </span>
                {set.visibility === "restricted" && (
                  <div className="flex items-center gap-2">
                    {users.map((user, i) => {
                      if (i <= 3) {
                        return (
                          <Avatar
                            key={user.id} // Add a key for best React practice
                            className={`w-10 h-10 border shadow-md ${i > 0 ? "-ml-4" : ""} ${i === 0 ? "z-10" : ""}`}
                          >
                            <AvatarImage src={user?.image_url || undefined} />
                            <AvatarFallback>
                              {user?.name?.charAt(0)} {user?.name?.charAt(1)}
                            </AvatarFallback>
                          </Avatar>
                        );
                      }
                    })}
                    <AddPeopleAccessPopover
                      set={set}
                      users={users}
                      isLoading={isLoading}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 flex-wrap pt-2 ">
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
                        <TooltipContent side="top">
                          Toggle Show Answer
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Badge variant="secondary" className="sm:hidden">
                      {itemsLength} questions
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 flex-wrap">
            <ExamsDialog set_id={set.id}>
              <Button
                variant="secondary"
                className="h-9 px-3 transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Manage Exams
              </Button>
            </ExamsDialog>
            <Badge variant="outline" className="hidden sm:inline-flex">
              {itemsLength} questions
            </Badge>
          </div>
        </div>

        {/* Action bar: switch, add question, questions badge (mobile visible) */}
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

function LoadingExistingSet() {
  const skeletonItems = Array.from({ length: 10 });
  return (
    <div className="flex flex-row flex-1 gap-4 justify-center">
      <div className="flex flex-col gap-4 w-full">
        {/* Header skeleton */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex flex-col gap-3 px-3 md:px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 sm:h-8 md:h-9 w-2/3" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        </div>
        {/* Grid skeleton */}
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 px-3">
            {skeletonItems.map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded" />
                    <Skeleton className="h-5 w-20 rounded" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-9 w-full rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
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
