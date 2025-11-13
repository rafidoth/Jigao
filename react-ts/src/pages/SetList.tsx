import { getRecentSets, createNewSetPost } from "@/api/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Globe2 as GlobeIcon,
  Lock as LockClosedIcon,
  Eye as EyeOpenIcon,
  Plus,
} from "lucide-react";

const lastModified = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const minutes = differenceInMinutes(now, date);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours} hours ago`;
  const days = differenceInDays(now, date);
  if (days < 7) return `${days} days ago`;
  const weeks = differenceInWeeks(now, date);
  if (weeks < 4) return `${weeks} weeks ago`;
  const months = differenceInMonths(now, date);
  if (months < 12) return `${months} months ago`;
  const years = differenceInYears(now, date);
  return `${years} years ago`;
};

const IconForVisibility = ({ visibility }: { visibility: string }) => {
  switch (visibility) {
    case "public":
      return <GlobeIcon className="h-5 w-5 text-muted-foreground" />;
    case "private":
      return <LockClosedIcon className="h-5 w-5 text-muted-foreground" />;
    case "restricted":
      return <EyeOpenIcon className="h-5 w-5 text-muted-foreground" />;
    default:
      return null;
  }
};

function SetList() {
  const {
    data: sets,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["sets"], queryFn: getRecentSets });

  const navigate = useNavigate();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createNewSetPost,
    onSuccess: (data) => {
      if (data.id) {
        navigate(`/sets/${data.id}`);
      }
    },
  });

  if (isLoading) return <div className="px-4 py-6 text-sm">Loading...</div>;
  if (isError)
    return (
      <div className="px-4 py-6 text-sm text-red-600">Error loading sets</div>
    );

  const handleCreateNewSet = async () => {
    await mutateAsync();
  };

  return (
    <div className="flex flex-col gap-4 px-3 lg:px-9 py-3">
      <div className="hidden md:flex flex-col gap-2 mb-10 align">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif ">
          My Sets
        </h2>
        <Button
          onClick={handleCreateNewSet}
          disabled={isPending}
          className="w-16 sm:w-20 md:w-[100px] cursor-pointer sm:text-lg md:text-xl"
          variant="secondary"
        >
          <Plus className="" /> New
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-100px)] pr-2">
        {/* Mobile floating create button */}
        <Button
          onClick={handleCreateNewSet}
          disabled={isPending}
          className="md:hidden fixed left-4 bottom-6 z-40 shadow-lg rounded-full h-12 w-12 p-0 flex items-center justify-center"
          aria-label="Create new set"
        >
          <Plus className="h-6 w-6" />
        </Button>
        <div className="hidden md:block overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%] text-xs md:text-sm">
                  Title
                </TableHead>
                <TableHead className="w-[20%] text-xs md:text-sm">
                  Visibility
                </TableHead>
                <TableHead className="w-[20%] text-xs md:text-sm">
                  Last Modified
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sets?.map((set: any) => (
                <TableRow
                  key={set.id}
                  className="cursor-pointer text-base md:text-lg lg:text-xl hover:bg-accent/60 hover:font-medium"
                  onClick={() => navigate(`/sets/${set.id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/sets/${set.id}`);
                    }
                  }}
                >
                  <TableCell className="capitalize text-foreground">
                    {set.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconForVisibility visibility={set.visibility} />
                      <span className="capitalize text-muted-foreground">
                        {set.visibility}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lastModified(set.updated_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Cards on mobile */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sets?.map((set: any) => (
            <Card
              key={set.id}
              className="p-4 hover:bg-accent/60 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => navigate(`/sets/${set.id}`)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/sets/${set.id}`);
                }
              }}
            >
              <div className="flex flex-col gap-1">
                <div className="text-base font-medium text-foreground capitalize">
                  {set.title}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconForVisibility visibility={set.visibility} />
                  <span className="capitalize">{set.visibility}</span>
                  <span className="mx-1">•</span>
                  <span>Last modified {lastModified(set.updated_at)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default SetList;
