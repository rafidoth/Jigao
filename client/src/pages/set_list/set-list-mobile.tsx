import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import type { NormalizedSetItem } from "./types";
import { lastModified } from "./utils";
import { VisibilityIcon } from "./visibility-icon";

interface SetListMobileProps {
  items: NormalizedSetItem[];
  onOpenSet: (setId: string | number) => void;
  onDeleteSet: (setId: string | number) => Promise<void>;
  deletingSetId: string | number | null;
}

export function SetListMobile({
  items,
  onOpenSet,
  onDeleteSet,
  deletingSetId,
}: SetListMobileProps) {
  return (
    <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map(({ set }) => (
        <Card
          key={set.id}
          className="p-4 hover:bg-accent/60 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          onClick={() => onOpenSet(set.id)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenSet(set.id);
            }
          }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-base font-medium text-foreground capitalize">{set.title}</div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${set.title}`}
                disabled={deletingSetId === set.id}
                onClick={(e) => {
                  e.stopPropagation();
                  void onDeleteSet(set.id);
                }}
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <VisibilityIcon visibility={set.visibility} />
              <span className="capitalize">{set.visibility}</span>
              <span className="mx-1">•</span>
              <span>Last modified {lastModified(set.updated_at)}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
