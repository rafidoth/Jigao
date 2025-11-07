


build_image:
	docker build -t ts-node-dev -f Dockerfile.dev .

run:
	docker run -p 50051:50051 -v "$(shell pwd)":/app ts-node-dev
