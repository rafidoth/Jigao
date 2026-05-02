import { createNewSetPost, deleteSetApi } from "@/api/mutation";
import { getSetsPage } from "@/api/query";
import { getErrorMessage } from "@/api/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { Filter, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LoadingSetList } from "./set_list/loading-set-list";
import { SetListDesktop } from "./set_list/set-list-desktop";
import { SetListMobile } from "./set_list/set-list-mobile";
import type { SetListApiItem, SetVisibilityFilter } from "./set_list/types";
import { normalizeSetItem } from "./set_list/utils";

interface SetFiltersPopoverProps {
    createdByInput: string;
    visibilityInput: SetVisibilityFilter;
    onChangeCreatedByInput: (value: string) => void;
    onChangeVisibilityInput: (value: SetVisibilityFilter) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
}

function SetFiltersPopover({
    createdByInput,
    visibilityInput,
    onChangeCreatedByInput,
    onChangeVisibilityInput,
    onApplyFilters,
    onClearFilters,
}: SetFiltersPopoverProps) {
    const [open, setOpen] = useState(false);

    const handleApply = () => {
        onApplyFilters();
        setOpen(false);
    };

    const handleClear = () => {
        onClearFilters();
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="cursor-pointer text-xs">
                    <Filter className="h-4 w-4" />
                    Filter
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] space-y-3" align="start">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Created by (email)</label>
                    <Input
                        value={createdByInput}
                        onChange={(e) => onChangeCreatedByInput(e.target.value)}
                        placeholder="owner@example.com"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Visibility</label>
                    <Select
                        value={visibilityInput}
                        onValueChange={(value) => onChangeVisibilityInput(value as SetVisibilityFilter)}
                    >
                        <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue placeholder="All visibility" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All visibility</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="restricted">Restricted</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-end gap-2">
                    <Button onClick={handleClear} variant="ghost" className="text-xs">
                        Clear
                    </Button>
                    <Button onClick={handleApply} variant="secondary" className="text-xs">
                        Apply
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function SetList() {
    const queryClient = useQueryClient();
    const [deletingSetId, setDeletingSetId] = useState<string | number | null>(null);
    const [createdByInput, setCreatedByInput] = useState("");
    const [visibilityInput, setVisibilityInput] = useState<SetVisibilityFilter>("all");
    const [createdBy, setCreatedBy] = useState("");
    const [visibility, setVisibility] = useState<SetVisibilityFilter>("all");

    const {
        data,
        error,
        isPending: isSetsLoading,
        isError,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["sets-list", createdBy, visibility],
        queryFn: ({ pageParam }) =>
            getSetsPage({
                createdBy,
                visibility,
                lastSeenId: pageParam,
            }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.next_last_seen_id,
        staleTime: 2 * 60 * 1000,
    });

    const navigate = useNavigate();
    const { mutateAsync, isPending: isCreatingSet } = useMutation({
        mutationFn: createNewSetPost,
        onSuccess: (data) => {
            if (data.id) {
                queryClient.invalidateQueries({ queryKey: ["sets-list"] });
                navigate(`/sets/${data.id}`);
            }
        },
    });

    const { mutateAsync: mutateDeleteSet } = useMutation({
        mutationFn: (setId: string | number) => deleteSetApi(setId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sets-list"] });
        },
    });

    const items = useMemo(() => {
        const list = data?.pages.flatMap((page) => page.sets) ?? [];
        const normalized = Array.isArray(list) ? (list as SetListApiItem[]) : [];
        return normalized.map(normalizeSetItem);
    }, [data]);

    const hasAnyItems = items.length > 0;

    if (isSetsLoading) return <LoadingSetList />;

    const handleApplyFilters = () => {
        setCreatedBy(createdByInput.trim());
        setVisibility(visibilityInput);
    };

    const handleClearFilters = () => {
        setCreatedByInput("");
        setVisibilityInput("all");
        setCreatedBy("");
        setVisibility("all");
    };

    const handleFetchMore = async () => {
        if (!hasNextPage || isFetchingNextPage) {
            return;
        }
        await fetchNextPage();
    };

    if (isError) {
        return (
            <div className="flex flex-col gap-3 px-3 lg:px-9 py-3">
                <h2 className="text-sm sm:text-2xl md:text-3xl font-bold my-2">My Sets</h2>
                <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
            </div>
        );
    }

    const handleCreateNewSet = async () => {
        await mutateAsync();
    };

    const handleOpenSet = (setId: string | number) => {
        navigate(`/sets/${setId}`);
    };

    const handleDeleteSet = async (setId: string | number) => {
        const confirmed = window.confirm("Delete this set? This action cannot be undone.");
        if (!confirmed) return;

        setDeletingSetId(setId);
        try {
            await mutateDeleteSet(setId);
        } finally {
            setDeletingSetId(null);
        }
    };

    return (
        <div className="flex flex-col gap-4 px-3 lg:px-9 py-3">
            <div className="hidden md:flex flex-col gap-2 mb-10">
                <h2 className="text-sm sm:text-2xl md:text-3xl font-bold my-2">My Sets</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <SetFiltersPopover
                        createdByInput={createdByInput}
                        visibilityInput={visibilityInput}
                        onChangeCreatedByInput={setCreatedByInput}
                        onChangeVisibilityInput={setVisibilityInput}
                        onApplyFilters={handleApplyFilters}
                        onClearFilters={handleClearFilters}
                    />
                    <Button
                        onClick={handleCreateNewSet}
                        disabled={isCreatingSet}
                        className="w-16 sm:w-20 md:w-[100px] cursor-pointer text-xs"
                        variant="secondary"
                    >
                        <Plus /> New
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[calc(100vh-100px)] pr-2">
                <div className="md:hidden mb-4 flex items-center justify-between gap-2">
                    <h2 className="text-base font-bold">My Sets</h2>
                    <SetFiltersPopover
                        createdByInput={createdByInput}
                        visibilityInput={visibilityInput}
                        onChangeCreatedByInput={setCreatedByInput}
                        onChangeVisibilityInput={setVisibilityInput}
                        onApplyFilters={handleApplyFilters}
                        onClearFilters={handleClearFilters}
                    />
                </div>

                <Button
                    onClick={handleCreateNewSet}
                    disabled={isCreatingSet}
                    className="md:hidden fixed left-4 bottom-6 z-40 shadow-lg rounded-full h-12 w-12 p-0 flex items-center justify-center"
                    aria-label="Create new set"
                >
                    <Plus className="h-6 w-6" />
                </Button>

                {!hasAnyItems ? (
                    <div className="rounded-md border p-6 text-sm text-muted-foreground">
                        No sets found for the selected filters.
                    </div>
                ) : (
                    <>
                        <SetListDesktop
                            items={items}
                            onOpenSet={handleOpenSet}
                            onDeleteSet={handleDeleteSet}
                            deletingSetId={deletingSetId}
                        />
                        <SetListMobile
                            items={items}
                            onOpenSet={handleOpenSet}
                            onDeleteSet={handleDeleteSet}
                            deletingSetId={deletingSetId}
                        />
                    </>
                )}

                {hasNextPage ? (
                    <div className="mt-4 flex justify-center pb-6">
                        <Button
                            onClick={handleFetchMore}
                            disabled={isFetchingNextPage}
                            variant="outline"
                            className="min-w-[120px]"
                        >
                            {isFetchingNextPage ? "Loading..." : "More"}
                        </Button>
                    </div>
                ) : null}
            </ScrollArea>
        </div>
    );
}

export default SetList;
