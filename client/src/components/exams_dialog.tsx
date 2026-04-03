import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { createExamApiPost } from "@/api/mutation";
import { ExamsList } from "./exams_dialog/exams-list";
import { RecentSelfTests } from "./exams_dialog/recent-self-tests";
import {
    DescriptionField,
    DurationField,
    ProctoringField,
    StartModeField,
    StartTimeField,
    TitleField,
    VisibilityField,
} from "./exams_dialog/form-fields";
import { useCreateExamStore } from "./exams_dialog/store";
import { nowLocalForInput, toISOFromLocal, validateExamInputs } from "./exams_dialog/utils";

function selfTestTimerKey(setId: string) {
    return `self-test:${setId}:timer`;
}

function selfTestAnswersKey(setId: string) {
    return `self-test:${setId}:answers`;
}

function hasResumableSelfTest(setId: string) {
    const raw = localStorage.getItem(selfTestTimerKey(setId));
    if (!raw) return false;
    try {
        const parsed = JSON.parse(raw) as { endTime?: number };
        return typeof parsed.endTime === "number" && parsed.endTime > Date.now();
    } catch {
        return false;
    }
}

export default function ExamsDialog({
    children,
    set_id,
}: {
    children: React.ReactNode;
    set_id: string;
}) {
    const [open, setOpen] = useState(false);
    const [selfTestPopoverOpen, setSelfTestPopoverOpen] = useState(false);
    const [selfTestDuration, setSelfTestDuration] = useState("30");
    const [hasResumable, setHasResumable] = useState(false);
    const title = useCreateExamStore((s) => s.title);
    const description = useCreateExamStore((s) => s.description);
    const startTimeLocal = useCreateExamStore((s) => s.startTimeLocal);
    const durationInMinutes = useCreateExamStore((s) => s.durationInMinutes);
    const visibility = useCreateExamStore((s) => s.visibility);
    const startMode = useCreateExamStore((s) => s.startMode);
    const proctoringEnabled = useCreateExamStore((s) => s.proctoringEnabled);
    const cameraRequired = useCreateExamStore((s) => s.cameraRequired);
    const reset = useCreateExamStore((s) => s.reset);

    const [error, setError] = useState("");
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (open && !startTimeLocal) {
            useCreateExamStore.getState().setStartTimeLocal(nowLocalForInput(10));
        }
    }, [open, startTimeLocal]);

    useEffect(() => {
        if (!open) return;
        setHasResumable(hasResumableSelfTest(set_id));
    }, [open, selfTestPopoverOpen, set_id]);

    const { mutateAsync, isPending } = useMutation({
        mutationFn: createExamApiPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exams", set_id] });
            reset();
            setError("");
            setOpen(false);
        },
        onError: () => setError("Failed to create exam. Please try again."),
    });

    const handleCreateExam = async () => {
        const validationResult = validateExamInputs(
            title,
            startTimeLocal,
            durationInMinutes,
        );
        if (validationResult.isError) {
            setError(validationResult.error);
            return;
        }
        setError("");
        try {
            await mutateAsync({
                set_id,
                title,
                description,
                start_time_iso: toISOFromLocal(startTimeLocal),
                duration_in_minutes: durationInMinutes,
                visibility,
                start_mode: startMode,
                proctoring_enabled: proctoringEnabled,
                camera_required: cameraRequired,
            });
        } catch (err) {
            console.error(err);
            setError("Failed to create exam. Please try again.");
        }
    };

    const handleStartSelfTest = () => {
        localStorage.removeItem(selfTestTimerKey(set_id));
        localStorage.removeItem(selfTestAnswersKey(set_id));
        localStorage.removeItem("self-test-timer");
        localStorage.removeItem("self-test-answers");

        const params = new URLSearchParams({
            setId: set_id,
            durationInMinutes: selfTestDuration,
        });
        setSelfTestPopoverOpen(false);
        setOpen(false);
        navigate(`/selftest/new?${params.toString()}`);
    };

    const handleResumeSelfTest = () => {
        const params = new URLSearchParams({ setId: set_id });
        setSelfTestPopoverOpen(false);
        setOpen(false);
        navigate(`/selftest/new?${params.toString()}`);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent side="right" className="w-[92vw] sm:max-w-xl md:max-w-2xl p-3">
                <SheetHeader className="pb-2">
                    <SheetTitle className="text-sm">Exams</SheetTitle>
                    <SheetDescription className="text-xs">
                        Create new exam and review scheduled exams for this set.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Dialog>
                                <DialogTrigger>
                                    <Button className="font-display cursor-pointer font-bold" variant="secondary">
                                        Create New Exam
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-1/2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-base font-semibold">Create Exam</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Configure details and schedule a start time.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-4">
                                        <div className="flex flex-col gap-4">
                                            <div className="sm:col-span-2">
                                                <TitleField />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <DescriptionField />
                                            </div>
                                            <StartTimeField />
                                            <DurationField />
                                        </div>
                                        <div className="flex flex-col gap-4 ">
                                            <VisibilityField />
                                            <StartModeField />
                                            <ProctoringField />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {error && (
                                            <Alert variant="destructive" className="sm:max-w-xs">
                                                <AlertDescription>{error}</AlertDescription>
                                            </Alert>
                                        )}
                                        <div className="ml-auto flex gap-3">
                                            <Button variant="outline" onClick={() => setOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleCreateExam} disabled={isPending}>
                                                {isPending ? "Creating..." : "Create"}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Popover open={selfTestPopoverOpen} onOpenChange={setSelfTestPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button className="font-display cursor-pointer font-bold" variant="outline">
                                        Take a Self Test
                                        {hasResumable && (
                                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72" align="start">
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <h4 className="text-sm font-semibold">Take a Self Test</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Select duration and start immediately.
                                            </p>
                                        </div>
                                        {hasResumable && (
                                            <div className="rounded-md border border-blue-500/30 bg-blue-500/10 p-2">
                                                <p className="text-xs text-blue-600 mb-2">
                                                    You have an unfinished self test.
                                                </p>
                                                <Button
                                                    className="w-full"
                                                    variant="secondary"
                                                    onClick={handleResumeSelfTest}
                                                >
                                                    Resume Test
                                                </Button>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-medium">Duration</label>
                                            <Select value={selfTestDuration} onValueChange={setSelfTestDuration}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select duration" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10 minutes</SelectItem>
                                                    <SelectItem value="15">15 minutes</SelectItem>
                                                    <SelectItem value="20">20 minutes</SelectItem>
                                                    <SelectItem value="30">30 minutes</SelectItem>
                                                    <SelectItem value="45">45 minutes</SelectItem>
                                                    <SelectItem value="60">60 minutes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button onClick={handleStartSelfTest}>
                                                {hasResumable ? "Start New Test" : "Start"}
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div>
                        <RecentSelfTests set_id={set_id} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold mb-1">Scheduled Exams</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            Review upcoming and past exams.
                        </p>
                        <ExamsList set_id={set_id} />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
