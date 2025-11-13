import axios from "axios";

export const getRecentSets = async () => {
  const res = await axios.get(`/api/v1/sets?recent=10`);
  return res.data;
};

export const createNewSetPost = async () => {
  const res = await axios.post(`/api/v1/sets`);
  return res.data;
};

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

export const userOnLogin = async (user: User) => {
  console.log("user body", user);
  const res = await axios.post(`/api/v1/users`, user);
  return res.data;
};
