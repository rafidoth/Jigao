import dotenv from "dotenv";
dotenv.config();

import express from "express";
import type { Express } from "express";
import cors from "cors";
import Router from "./routes/route.js";

const app: Express = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());

const router = new Router(app);
const routeBindedServer = router.bindRoutes();

routeBindedServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
