import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Settings as GearIcon,
  Plus as PlusIcon,
  ArrowLeft,
  Grid3X3Icon,
  LucideEye,
  Globe2Icon,
  LockIcon,
  EyeIcon,
} from "lucide-react";

import CreateNewQuestionPopover from "../create_new_question_popover.tsx";
import ExamsDialog from "../exams_dialog.tsx";
import SetSettingsUpdatePopover from "../set_settings_update_popover.tsx";
import { Badge } from "@/components/ui/badge";
import AddPeopleAccessPopover from "@/components/add_people_access_popover.tsx";
import { Button } from "../ui/button.tsx";
import { getUsersWithAccess } from "@/api/api.ts";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import Toggler from "@/components/Toggler.tsx";

interface User {
  id: string | number;
  name: string;
  email: string;
  image_url?: string | null;
}

function getVisibilityIcon(visibility: string) {
  switch (visibility) {
    case "public":
      return <Globe2Icon className="h-5 w-5" />;
    case "private":
      return <LockIcon className="h-5 w-5" />;
    case "restricted":
      return <EyeIcon className="h-5 w-5" />;
    default:
      return null;
  }
}
function ExistingSetHeader({
  set,
  itemsLength,
  showAnswer,
  toggleShowAnswer,
  gridLayout,
  toggleGridLayout,
}: {
  set: any;
  itemsLength: number;
  showAnswer: boolean;
  toggleShowAnswer: () => void;
  gridLayout: boolean;
  toggleGridLayout: () => void;
}) {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["usersWithAccess", set.id],
    queryFn: () => getUsersWithAccess(set.id),
  });

  const navigate = useNavigate();

  return (
    <div className="w-full sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex flex-col gap-3 px-3 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-x-4">
                <Button
                  variant="outline"
                  className="h-9 w-9 rounded-full transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft />
                </Button>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight leading-tight break-words text-foreground ">
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
                    <Toggler
                      state={!showAnswer}
                      onCheckedChange={toggleShowAnswer}
                    >
                      <LucideEye /> Answers
                    </Toggler>
                    <Toggler
                      state={gridLayout}
                      onCheckedChange={toggleGridLayout}
                    >
                      <Grid3X3Icon />
                    </Toggler>
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

export default ExistingSetHeader;
