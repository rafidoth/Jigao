import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Globe2 as GlobeIcon,
  Lock as LockClosedIcon,
  Eye as EyeOpenIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SetLike } from "./add_people_access_popover/types";

type Visibility = "public" | "private" | "restricted";

interface SetSettingsSet extends SetLike {
  title: string;
  visibility: Visibility;
}

interface SetSettingsUpdatePopoverProps {
  set: SetSettingsSet;
  children: React.ReactNode;
}

interface UpdateSetSettingsVariables {
  set_id: string | number;
  title: string;
  visibility: Visibility;
}

async function updateSetSettings(variables: UpdateSetSettingsVariables) {
  const { set_id, title, visibility } = variables;
  const body = { title, visibility };
  const res = await axios.put(`/api/v1/sets/${set_id}`, body);
  return res.data;
}

function SetSettingsUpdatePopover({
  set,
  children,
}: SetSettingsUpdatePopoverProps) {
  const [title, setTitle] = useState<string>(set.title);
  const visibilityList = ["public", "private", "restricted"] as const;
  const [currentVisibility, setCurrentVisibility] = useState<Visibility>(
    set.visibility,
  );
  const [error, setError] = useState<string>("");
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: updateSetSettings,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["set", variables.set_id] });
      setError("");
      // console.log("Set Settings updated successfully");
    },
    onError: () => {
      setError("Failed to update set. Please try again.");
    },
  });

  const handleApply = async () => {
    await mutateAsync({ set_id: set.id, title, visibility: currentVisibility });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[600px] p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Set Settings</h3>
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="text-sm font-medium pt-2">Visibility</label>
          <VisibilityList
            currentVisibility={currentVisibility}
            setCurrentVisibility={setCurrentVisibility}
            visibilityList={visibilityList}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end pt-2">
          <Button
            disabled={
              !title ||
              !currentVisibility ||
              title.trim() === "" ||
              (title === set.title && currentVisibility === set.visibility)
            }
            onClick={handleApply}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
export default SetSettingsUpdatePopover;

function VisibilityList({
  currentVisibility,
  setCurrentVisibility,
  visibilityList,
}: {
  currentVisibility: Visibility;
  setCurrentVisibility: (value: Visibility) => void;
  visibilityList: readonly Visibility[];
}) {
  return (
    <div className="w-full">
      <div className="flex w-full justify-between gap-2">
        {visibilityList.map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => setCurrentVisibility(v)}
            className={cn(
              "flex flex-col items-center gap-2 w-1/3 rounded-md border p-3 text-sm transition",
              currentVisibility === v
                ? "border-primary bg-primary/10"
                : "border-muted bg-muted/30 hover:bg-muted",
            )}
          >
            <span className="capitalize">{v}</span>
            {getVisibilityIcon(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

function getVisibilityIcon(visibility: Visibility) {
  switch (visibility) {
    case "public":
      return <GlobeIcon className="h-6 w-6" />;
    case "private":
      return <LockClosedIcon className="h-6 w-6" />;
    case "restricted":
      return <EyeOpenIcon className="h-6 w-6" />;
    default:
      return null;
  }
}
