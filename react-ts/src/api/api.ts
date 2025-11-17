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
  image_url: string | null;
}

export const userOnLogin = async (user: User) => {
  console.log("user body", user);
  const res = await axios.post(`/api/v1/users`, user);
  return res.data;
};

export const getUsersWithAccess = async (setId: string | number) => {
  const res = await axios.get(`/api/v1/sets/access_list/${setId}`);
  return res.data;
};

export const getQuestions = async (set_id: string) => {
  const res = await axios.get(`/api/v1/questions?set_id=${set_id}`);
  return res.data;
};

export const getSet = async (set_id: string) => {
  const res = await axios.get(`/api/v1/sets/${set_id}`);
  return res.data;
};
