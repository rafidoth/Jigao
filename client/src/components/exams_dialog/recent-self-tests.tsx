import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { fetchRecentSelfTests } from "@/api/query";
import type { SelfTestSubmission } from "./types";

interface RecentSelfTestsProps {
    set_id: string;
}

interface ApiResponse {
    success: boolean;
    data: SelfTestSubmission[];
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
}

function SelfTestItem({
    submission,
    onClick,
}: {
    submission: SelfTestSubmission;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group"
        >
            <span className="text-sm text-muted-foreground">
                {formatRelativeTime(submission.created_at)}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
    );
}

export function RecentSelfTests({ set_id }: RecentSelfTestsProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const navigate = useNavigate();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["recent-self-tests", set_id],
        queryFn: () => fetchRecentSelfTests(set_id),
    });

    const handleNavigateToResult = (selfTestId: string) => {
        setDialogOpen(false);
        navigate(`/selftest/${selfTestId}`);
    };

    if (isLoading) {
        return (
            <div className="py-2">
                <p className="text-xs text-muted-foreground">Loading recent tests...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="py-2">
                <p className="text-xs text-destructive">Failed to load recent tests.</p>
            </div>
        );
    }

    const response = data as ApiResponse;
    const submissions: SelfTestSubmission[] = response?.data ?? [];

    if (submissions.length === 0) {
        return (
            <div className="py-2">
                <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">No self tests yet.</p>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => refetch()}>
                        <RotateCcw className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    }

    const visibleSubmissions = submissions.slice(0, 3);
    const remainingCount = submissions.length - 3;

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Recent Self Tests</h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => refetch()}>
                    <RotateCcw className="h-3 w-3" />
                </Button>
            </div>
            <Card className="p-1">
                <div className="flex flex-col">
                    {visibleSubmissions.map((submission) => (
                        <SelfTestItem
                            key={submission.self_test_id}
                            submission={submission}
                            onClick={() => handleNavigateToResult(submission.self_test_id)}
                        />
                    ))}

                    {remainingCount > 0 && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    +{remainingCount} more
                                    <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>All Recent Self Tests</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col gap-1 mt-2">
                                    {submissions.map((submission) => (
                                        <SelfTestItem
                                            key={submission.self_test_id}
                                            submission={submission}
                                            onClick={() => handleNavigateToResult(submission.self_test_id)}
                                        />
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </Card>
        </div>
    );
}
