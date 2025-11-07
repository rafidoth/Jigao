# OnlyExams – Project Summary

## Overview
- Web platform to create question sets and run timed exams with real‑time rooms.
- Optional AI service generates questions via gRPC.

## Tech Stack
- Backend (Go): chi v5 (HTTP), gorilla/websocket, pgx v5 (Postgres), slog (logging), godotenv (env), go-chi/cors, gRPC client.
- Database: PostgreSQL with enums (`visibility`, `difficulty`, `question_type`); tables: `users`, `sets`, `contexts`, `questions`, `choices`, `answers`, `exams`, `exam_participants`; triggers to maintain `updated_at`.
- AI Service (Node/TypeScript): @grpc/grpc-js + proto-loader; implements `JigaoAI.GenerateQuestions`; listens on `0.0.0.0:50051`.
- Frontend (React): Vite, React 19, TailwindCSS 4, Radix UI, TanStack Query, Zustand, react-use-websocket, React Router.

## Services & Modules
- HTTP API (`server.go`):
  - `/api/v1/sets`: list recent, create, get, update, delete; generate AI question set; manage contexts.
  - `/api/v1/questions`: create new question in a set; fetch all questions in a set.
  - `/api/v1/exams`: create exam on a set; list by set; get exam by id; get exam questions.
- WebSocket Exam Rooms (`internal/exams`):
  - Create room: `POST /api/v1/exams/rooms/{exam_id}` (1:1 with exam).
  - Join room: `GET /api/v1/exams/join/{room_id}?role=c|p` (controller/participant).
  - `ExamHub` manages rooms/clients, broadcasts events: `on-join-room`, `exam-starts-now`, `exam-ends-now`; timers based on exam start/end.
- AI Integration: Go backend is a gRPC client to the TS AI service; proto at `proto/jigao_ai.proto` with Go stubs in `proto/*.pb.go`.

## Configuration & Runtime
- Env (`config.Config`): `PORT`, `DBSTRING`, `CORS_ALLOWED_ORIGIN`, `LOG_STYLE`, `LOG_LEVEL` (autoloaded via `.env`).
- Ports: Backend defaults to `:9999` if `PORT` unset; AI service `:50051`. Docker network `jigao-network` used for inter‑service comms (AI hostname `ai-service`).
- Dev tooling (`Makefile`):
  - Backend: `make server` (local), `make run` (Docker). Hot reload via `make air` (Air config).
  - AI service: `make build_jigao_ai_image` + `make jrun`.
  - Frontend: `make frontend` (Vite dev).
  - Production: `make prod_build` / `make prod_run`.

## Middleware & Security
- Middlewares: RequestID, RealIP, Recoverer, NoCache, CORS (origin from env), security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: deny`), request logging.
- Auth: placeholder middleware injecting `user-id` into context (TODO: real auth/verification).
- DB access: via pooled pgx; parameterized queries (stores under `internal/*Store`).

## Notable Conventions
- Structured logging with `slog` (text handler, level debug).
- Clear separation: handlers, stores, models, and WS hub; small interfaces at consumer side.
- Frontend uses modern React state/data tools and WS for exam rooms.
