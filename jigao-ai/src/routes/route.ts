import type { Express } from "express";
import upload from "../middlewares/multer.middleware.js";
import { generateQuestions } from "../controllers/question_generation.controller.js";

class Router {
  server: Express;

  constructor(server: Express) {
    this.server = server;
  }

  bindRoutes(): Express {
    this.server.post(
      "/api/chat",
      upload.array("attachments", 5),
      generateQuestions,
    );
    return this.server;
  }
}

export default Router;
