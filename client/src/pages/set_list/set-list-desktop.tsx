import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash } from "lucide-react";
import type { NormalizedSetItem } from "./types";
import { lastModified } from "./utils";
import { VisibilityIcon } from "./visibility-icon";

interface SetListDesktopProps {
    items: NormalizedSetItem[];
    onOpenSet: (setId: string | number) => void;
    onDeleteSet: (setId: string | number) => Promise<void>;
    deletingSetId: string | number | null;
}

export function SetListDesktop({
    items,
    onOpenSet,
    onDeleteSet,
    deletingSetId,
}: SetListDesktopProps) {
    return (
        <div className="hidden md:block overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%] text-xs md:text-xs">Title</TableHead>
                        <TableHead className="w-[20%] text-xs md:text-xs">Created By</TableHead>
                        <TableHead className="w-[20%] text-xs md:text-xs">Visibility</TableHead>
                        <TableHead className="w-[20%] text-xs md:text-xs">Last Modified</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map(({ set, owner }) => (
                        <TableRow
                            key={set.id}
                            className="cursor-pointer text-xs hover:bg-primary hover:font-medium hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
                                <span className="font-semibold">{owner.name}</span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <VisibilityIcon visibility={set.visibility} />
                                    <span className="capitalize">{set.visibility}</span>
                                </div>
                            </TableCell>
                            <TableCell>{lastModified(set.updated_at)}</TableCell>
                            <TableCell className="text-right">
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
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
