import axios from "axios";
import type { User } from "./types";

export const getUserFromEmail = async (email: string): Promise<User> => {
  const res = await axios.get(
    `/api/v1/users/user?email=${encodeURIComponent(email)}`,
  );
  return res.data;
};

export const addUserToAccessList = async ({
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
