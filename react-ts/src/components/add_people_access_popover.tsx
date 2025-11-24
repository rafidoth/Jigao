import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import axios from "axios";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";

interface User {
  id: string | number;
  name: string;
  email: string;
  image_url?: string | null;
}

interface SetLike {
  id: string | number;
}

const getUserFromEmail = async (email: string): Promise<User> => {
  const res = await axios.get(
    `/api/v1/users/user?email=${encodeURIComponent(email)}`,
  );
  return res.data;
};

const addUserToAccessList = async ({
  setId,
  userId,
}: {
  setId: string | number;
  userId: string | number;
}) => {
  await axios.post(`/api/v1/sets/access`, {
    user_id: userId,
    set_id: setId,
  });
};

const getInitials = (name?: string | null) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
};

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

  const [emailInput, setEmailInput] = useState("");
  const [userChecking, setUserChecking] = useState(false);
  const [foundUser, setFoundUser] = useState<User | "not_found" | null>(null);

  const isValidEmailFormat = (email: string) =>
    /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);

  // Preserve original semantics: invalid if already present in access list
  const isValidEmail = (email: string) => {
    for (const user of users) {
      if (user.email === email) return false;
    }
    return isValidEmailFormat(email);
  };

  const handleAddAccess = async () => {
    if (!isValidEmail(emailInput)) return;
    if (!foundUser || foundUser === "not_found") return;
    await mutateAsync({ setId: set.id, userId: foundUser.id });
    setEmailInput("");
    setFoundUser(null);
  };

  const handleRemoveAccess = async (userId: string | number) => {
    await mutateAsync({ setId: set.id, userId });
    queryClient.invalidateQueries({ queryKey: ["usersWithAccess", set.id] });
  };

  useEffect(() => {
    const value = emailInput.trim();
    if (!value) return;

    const handle = setTimeout(async () => {
      if (isValidEmail(value)) {
        setUserChecking(true);
        try {
          const data = await getUserFromEmail(value);
          setFoundUser(data);
        } catch (e) {
          console.error(e);
          setFoundUser("not_found");
        }
        setUserChecking(false);
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [emailInput]);

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
          {userChecking && (
            <div className="text-muted-foreground text-sm">Checking...</div>
          )}
          {isPending && (
            <div className="text-muted-foreground text-sm">
              Adding {typeof foundUser === "object" ? foundUser?.name : "User"}{" "}
              to access list...
            </div>
          )}
          {foundUser && foundUser !== "not_found" && (
            <Card className="rounded-lg border border-border ">
              <CardContent>
                <div className="flex gap-x-3 items-center">
                  <Avatar className="w-12 h-12 ring-1 ring-border">
                    <AvatarImage src={foundUser?.image_url || undefined} />
                    <AvatarFallback>
                      {getInitials(foundUser?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <h2 className="text-sm font-semibold leading-none">
                      {foundUser?.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {foundUser?.email}
                    </p>
                  </div>

                  <Button
                    variant={"outline"}
                    onClick={handleAddAccess}
                    className="ml-auto"
                  >
                    Allow
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div>
            {foundUser === "not_found" && (
              <span className="text-red-700 text-sm">User not found</span>
            )}
          </div>
          {!isLoading && (
            <div className="flex flex-col gap-y-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Access List
              </span>
              <div className="flex flex-col gap-y-2">
                {users.map((user) => (
                  <Card
                    key={user.id}
                    className="group rounded-lg border border-border"
                  >
                    <CardContent>
                      <div className="flex gap-x-3 items-center">
                        <Avatar className="w-12 h-12 ring-1 ring-border">
                          <AvatarImage src={user?.image_url || undefined} />
                          <AvatarFallback>
                            {getInitials(user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex justify-between items-center w-full">
                          <div className="flex flex-col">
                            <h2 className="text-sm font-semibold leading-none">
                              {user?.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              {user?.email}
                            </p>
                          </div>
                          <span
                            className="rounded-full opacity-70 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveAccess(user.id)}
                          >
                            <X />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
