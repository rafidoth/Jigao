FROM golang:tip-alpine AS dev

RUN apk add --no-cache git bash 
RUN go install github.com/air-verse/air@v1.63.0

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

# NOTE: The critical part is that your docker-compose.yml MUST use a bind mount 
# (volume: .:/app) so that changes on your host are reflected inside this container.
COPY . .

EXPOSE 3000


CMD ["sh", "-c","air", "-c", ".air.toml"]
