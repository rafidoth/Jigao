import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { NormalizedSetItem } from "./types";
import { lastModified } from "./utils";
import { VisibilityIcon } from "./visibility-icon";

interface SetListDesktopProps {
  items: NormalizedSetItem[];
  onOpenSet: (setId: string | number) => void;
}

export function SetListDesktop({ items, onOpenSet }: SetListDesktopProps) {
  return (
    <div className="hidden md:block overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%] text-xs md:text-sm">Title</TableHead>
            <TableHead className="w-[20%] text-xs md:text-sm">Created By</TableHead>
            <TableHead className="w-[20%] text-xs md:text-sm">Visibility</TableHead>
            <TableHead className="w-[20%] text-xs md:text-sm">Last Modified</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(({ set, owner }) => (
            <TableRow
              key={set.id}
              className="cursor-pointer text-sm hover:bg-primary hover:font-medium hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => onOpenSet(set.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenSet(set.id);
                }
              }}
            >
              <TableCell className="capitalize">{set.title}</TableCell>
              <TableCell className="flex gap-x-2 items-center">
                <Avatar>
                  <AvatarImage src={owner.image_url ?? undefined} alt={set.name} />
                  <AvatarFallback>
                    {owner.name?.[0]} {owner.name?.[1]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold">{owner.name}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <VisibilityIcon visibility={set.visibility} />
                  <span className="capitalize">{set.visibility}</span>
                </div>
              </TableCell>
              <TableCell>{lastModified(set.updated_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
