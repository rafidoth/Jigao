import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function LoadingSetList() {
  const rows = Array.from({ length: 6 });
  const cards = Array.from({ length: 6 });

  return (
    <div className="flex flex-col gap-4 px-3 lg:px-9 py-3">
      <div className="hidden md:flex flex-col gap-2 mb-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      <ScrollArea className="h-[calc(100vh-100px)] pr-2">
        <div className="hidden md:block overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%] text-xs md:text-sm">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="w-[20%] text-xs md:text-sm">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead className="w-[20%] text-xs md:text-sm">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="w-[20%] text-xs md:text-sm">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-4/5" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-24" />
                  <span className="mx-1">•</span>
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
