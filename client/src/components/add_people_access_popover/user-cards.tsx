import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import type { User } from "./types";
import { getInitials } from "./utils";

export function FoundUserCard({
  user,
  onAllow,
}: {
  user: User;
  onAllow: () => void;
}) {
  return (
    <Card className="rounded-lg border border-border">
      <CardContent>
        <div className="flex gap-x-3 items-center">
          <Avatar className="w-12 h-12 ring-1 ring-border">
            <AvatarImage src={user.image_url || undefined} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="text-xs font-semibold leading-none">{user.name}</h2>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          <Button variant="outline" onClick={onAllow} className="ml-auto">
            Allow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AccessListUserCard({
  user,
  onRemove,
}: {
  user: User;
  onRemove: (id: string | number) => void;
}) {
  return (
    <Card className="group rounded-lg border border-border">
      <CardContent>
        <div className="flex gap-x-3 items-center">
          <Avatar className="w-12 h-12 ring-1 ring-border">
            <AvatarImage src={user.image_url || undefined} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <h2 className="text-xs font-semibold leading-none">{user.name}</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              type="button"
              className="rounded-full opacity-70 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(user.id)}
              aria-label={`Remove ${user.name} access`}
            >
              <X />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
