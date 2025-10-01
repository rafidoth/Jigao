

server :
	CGO_ENABLED=0 go build -ldflags="-s -w" -o main && ./main


build:
	docker build -t onlyexams .

air:
	docker run -p 3000:3000 -v "$(shell pwd)":/app onlyexams 


