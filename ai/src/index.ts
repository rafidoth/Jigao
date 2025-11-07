import * as grpc from "@grpc/grpc-js";
import { JigaoAIService } from "./interfaces/grpc";
import GrpcServer from "./server";
import generateQuestions from "./rpcs/GenerateQuestions";

require("dotenv").config();

const service_rpcs: JigaoAIService = {
  GenerateQuestions: generateQuestions,
};

const grpcServer = new GrpcServer(service_rpcs);
grpcServer.run();
