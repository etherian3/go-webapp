FROM golang:1.22.5 as base

WORKDIR /app

COPY go.mod .

# RUN go mod download | Untuk download dependency apabila di go.mod memiliki banyak dependencies

COPY . .

RUN go build -o main . 

# EXPOSE 8080

# CMD ["./main"]

# Final stage - Distroless images
FROM gcr.io/distroless/base

COPY --from=base /app/main .

COPY --from=base /app/static ./static

EXPOSE 8080

CMD [ "./main" ]
