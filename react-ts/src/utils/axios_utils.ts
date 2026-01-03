import axios from "axios";
const ai_api = axios.create({
  baseURL: "http://localhost:3000",
});

export { ai_api };
