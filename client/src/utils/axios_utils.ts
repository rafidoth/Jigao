import axios from "axios";

const ai_api = axios.create({
  baseURL: "http://localhost:3000",
});

const backend_api = axios.create({
  baseURL: "http://localhost:9999",
});

export { ai_api, backend_api };
