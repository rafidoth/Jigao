import { createNewSetPost, deleteSetApi } from "@/api/mutation";
import { getRecentSets } from "@/api/query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LoadingSetList } from "./set_list/loading-set-list";
import { SetListDesktop } from "./set_list/set-list-desktop";
import { SetListMobile } from "./set_list/set-list-mobile";
import type { SetListApiItem } from "./set_list/types";
import { normalizeSetItem } from "./set_list/utils";

function SetList() {
    const queryClient = useQueryClient();
    const { data: sets, isLoading } = useQuery({
        queryKey: ["sets"],
        queryFn: getRecentSets,
        staleTime: 2 * 60 * 1000,
    });
    const [deletingSetId, setDeletingSetId] = useState<string | number | null>(null);

    const navigate = useNavigate();
    const { mutateAsync, isPending } = useMutation({
        mutationFn: createNewSetPost,
        onSuccess: (data) => {
            if (data.id) {
                queryClient.invalidateQueries({ queryKey: ["sets"] })
                navigate(`/sets/${data.id}`);
            }
        },
    });

    const { mutateAsync: mutateDeleteSet } = useMutation({
        mutationFn: (setId: string | number) => deleteSetApi(setId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sets"] });
        },
    });

    const items = useMemo(() => {
        const list = Array.isArray(sets) ? (sets as SetListApiItem[]) : [];
        return list.map(normalizeSetItem);
    }, [sets]);

    if (isLoading) return <LoadingSetList />;

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
            <div className="hidden md:flex flex-col gap-2 mb-10 align">
                <h2 className="text-sm sm:text-2xl md:text-3xl font-bold my-2">My Sets</h2>
                <Button
                    onClick={handleCreateNewSet}
                    disabled={isPending}
                    className="w-16 sm:w-20 md:w-[100px] cursor-pointer text-xs"
                    variant="secondary"
                >
                    <Plus /> New
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-100px)] pr-2">
                <Button
                    onClick={handleCreateNewSet}
                    disabled={isPending}
                    className="md:hidden fixed left-4 bottom-6 z-40 shadow-lg rounded-full h-12 w-12 p-0 flex items-center justify-center"
                    aria-label="Create new set"
                >
                    <Plus className="h-6 w-6" />
                </Button>

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
            </ScrollArea>
        </div>
    );
}

export default SetList;
