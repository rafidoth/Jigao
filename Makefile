

server :
	CGO_ENABLED=0 go build -ldflags="-s -w" -o main && ./main


dev_build:
	docker build -f Dockerfile.dev -t onlyexams .

run:
	docker run -p 9999:9999 -v "$(shell pwd)":/app onlyexams


build_jigao_ai_image:
	cd jigao_ai && docker build -t ts-node-dev -f Dockerfile.dev .

jrun:
	cd jigao_ai &&  docker run -p 50051:50051 -v "$(shell pwd)/jigao_ai":/app ts-node-dev

frontend:
	cd web && npm run dev

prod_build:
	docker build -f Dockerfile.prod -t onlyexams:prod .

prod_run:
	docker run -p 9999:9999 onlyexams:prod








xm:
	cd internal/exams/ && nvim .

q:
	cd internal/questions/ && nvim .

f:
	cd web/ && nvim .
