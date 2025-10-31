import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "node:path";
import { ServiceDefinition } from "@grpc/grpc-js";
import { JigaoAIService } from "./interfaces/grpc";

export default class GrpcServer {
  private service: JigaoAIService;
  constructor(s: JigaoAIService) {
    this.service = s;
  }

  run() {
    const proto_path = path.join(__dirname, "proto", "jigao_ai.proto");
    console.log(`Loading proto from: ${proto_path}`);

    const packageDefinition = protoLoader.loadSync(proto_path, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const proto: any = grpc.loadPackageDefinition(packageDefinition);

    const serviceDefinition = proto.jigao_ai.JigaoAI
      .service as ServiceDefinition;

    const server = new grpc.Server();

    const ai_service: grpc.UntypedServiceImplementation = this
      .service as unknown as grpc.UntypedServiceImplementation;

    server.addService(serviceDefinition, ai_service);

    function main() {
      server.bindAsync(
        "0.0.0.0:50051",
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
          if (err) {
            console.error("Failed to bind server:", err);
            return;
          }
          console.log(`Server started on port ${port}`);
        },
      );
    }

    main();
  }
}
