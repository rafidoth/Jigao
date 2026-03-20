import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Input } from "./ui/input";
import { addUserToAccessList } from "@/api/mutation";
import type { SetLike, User } from "./add_people_access_popover/types";
import { useEmailUserLookup } from "./add_people_access_popover/use-email-user-lookup";
import {
  AccessListUserCard,
  FoundUserCard,
} from "./add_people_access_popover/user-cards";

function AddPeopleAccessPopover({
  set,
  users,
  isLoading,
}: {
  set: SetLike;
  users: User[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: addUserToAccessList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usersWithAccess", set.id] });
    },
  });

  const {
    emailInput,
    setEmailInput,
    userChecking,
    foundUser,
    isValidEmail,
    reset,
  } = useEmailUserLookup(users);

  const handleAddAccess = async () => {
    if (!isValidEmail(emailInput)) return;
    if (!foundUser || foundUser === "not_found") return;

    await mutateAsync({ setId: set.id, userId: foundUser.id });
    reset();
  };

  const handleRemoveAccess = async (userId: string | number) => {
    await mutateAsync({ setId: set.id, userId });
    queryClient.invalidateQueries({ queryKey: ["usersWithAccess", set.id] });
  };

  return (
    <Popover>
      <PopoverTrigger
        className="rounded-full hover:bg-accent hover:text-white p-2 border border-dashed -ml-4"
        aria-label="Add people"
      >
        <Plus />
      </PopoverTrigger>
      <PopoverContent className="font-sans font-medium w-[400px] p-4 space-y-4">
        <div className="flex flex-col gap-y-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Allow access to this set
          </span>
          <div className="flex gap-x-2">
            <Input
              type="email"
              value={emailInput}
              placeholder="Enter Email of User to provide access"
              onChange={(e) => setEmailInput(e.target.value)}
            />
          </div>

          {userChecking && <div className="text-muted-foreground text-xs">Checking...</div>}

          {isPending && (
            <div className="text-muted-foreground text-xs">
              Adding {typeof foundUser === "object" ? foundUser?.name : "User"} to
              access list...
            </div>
          )}

          {foundUser && foundUser !== "not_found" && (
            <FoundUserCard user={foundUser} onAllow={handleAddAccess} />
          )}

          {foundUser === "not_found" && (
            <span className="text-red-700 text-xs">User not found</span>
          )}

          {!isLoading && (
            <div className="flex flex-col gap-y-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Access List
              </span>
              <div className="flex flex-col gap-y-2">
                {users.map((user) => (
                  <AccessListUserCard
                    key={user.id}
                    user={user}
                    onRemove={handleRemoveAccess}
                  />
                ))}
                {users.length === 0 && (
                  <div className="text-muted-foreground">No users found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default AddPeopleAccessPopover;
