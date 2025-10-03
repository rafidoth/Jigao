

server :
	CGO_ENABLED=0 go build -ldflags="-s -w" -o main && ./main


build:
	docker build -t onlyexams .

air:
	docker run -p 9999:9999 -v "$(shell pwd)":/app onlyexams 


frontend:
	cd web && npm run dev

