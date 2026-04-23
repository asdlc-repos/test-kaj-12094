FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o todo-api .

FROM alpine:3.19
RUN mkdir -p /data
WORKDIR /app
COPY --from=builder /app/todo-api .
EXPOSE 9090
ENTRYPOINT ["./todo-api"]
