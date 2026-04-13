import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ExamLoading() {
    return (
        <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading exam details...</span>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default ExamLoading;
