

server :
	CGO_ENABLED=0 go build -ldflags="-s -w" -o main && ./main

