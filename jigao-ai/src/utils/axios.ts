import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import type { ExpectedLlmResponse } from "../chains/schema.js";

const GO_BACKEND_URL = process.env.GO_BACKEND_URL;
if (!GO_BACKEND_URL) {
  throw new Error("GO_BACKEND_URL is not defined in environment variables.");
}
const axiosClient = axios.create({
  baseURL: GO_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface SaveQuestionsResponse {
  set_id: string;
}

const saveQuestions = async (
  questionsSet: ExpectedLlmResponse,
  token: string,
): Promise<SaveQuestionsResponse> => {
  // console.log("Saving questions with token:", token);
  try {
    const response = await axiosClient.post(
      "sets/save_generated",
      questionsSet,
      {
        headers: {
          Authorization: token,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error saving questions:", error);
    throw error;
  }
};
export { axiosClient, saveQuestions };
