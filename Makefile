
APP_NAME=myapp

server :
	CGO_ENABLED=0 go build -ldflags="-s -w" -o $(APP_NAME) && ./$(APP_NAME)

