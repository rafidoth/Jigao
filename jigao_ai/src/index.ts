import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "node:path";
import { ServiceDefinition, UntypedServiceImplementation } from "@grpc/grpc-js";

type Question = {
  question: string;
  choices: string[];
  answer: string;
};

const server_rpcs: UntypedServiceImplementation = {
  GenerateQuestions: generateQuestions as grpc.handleUnaryCall<any, any>,
};

const proto_path = path.join(__dirname, "proto", "fast_exams_ai.proto");
console.log(`Loading proto from: ${proto_path}`);

const packageDefinition = protoLoader.loadSync(proto_path);
const proto: any = grpc.loadPackageDefinition(packageDefinition);

const serviceDefinition = proto.fast_exams_ai.FastExamsAI
  .service as ServiceDefinition;

const server = new grpc.Server();
server.addService(serviceDefinition, server_rpcs);

function generateQuestions(call: any, callback: grpc.sendUnaryData<any>) {
  const { userId, quantity, context, instructions } = call.request;

  const questions: Question[] = [
    { question: "What is 2+2?", choices: ["3", "4", "5"], answer: "4" },
  ];

  callback(null, { questions });
}

function main() {
  server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error("Failed to bind server:", err);
        return;
      }
      server.start();
      console.log(`Server started on port ${port}`);
    },
  );
}

main();
