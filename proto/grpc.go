package proto

import (
	"log"

	grpc "google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type AiService struct {
	conn   *grpc.ClientConn
	Client JigaoAIClient
}

func NewAiServiceClient() *AiService {
	conn, err := grpc.NewClient(
		"ai-service:50051",
		grpc.WithTransportCredentials(insecure.NewCredentials()))

	if err != nil {
		log.Fatal("Failed to connect to grpc server", err)
	}

	client := NewJigaoAIClient(conn)
	return &AiService{
		Client: client,
		conn:   conn,
	}
}

func (s *AiService) Close() error {
	return s.conn.Close()
}
