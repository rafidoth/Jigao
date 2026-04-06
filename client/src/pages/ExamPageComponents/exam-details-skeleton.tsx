import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ExamDetailsSkeleton() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="gap-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-2/5" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-40" />
      </CardFooter>
    </Card>
  );
}

export default ExamDetailsSkeleton;
