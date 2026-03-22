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
        const params = new URLSearchParams({
            setId: set_id,
            durationInMinutes: selfTestDuration,
        });
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
                                            <Button onClick={handleStartSelfTest}>Start</Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
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
