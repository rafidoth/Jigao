---
name: go-rest-api-builder
description: Build REST APIs in this Go project using its layered architecture (router -> handler -> service -> repository -> model). Starts by asking requirements, then produces an implementation plan, then executes accurately.
license: MIT
allowed-tools: Read, Glob, Grep, Bash
---

# Go REST API Builder (Project-Aware)

Build or extend REST APIs in this repository by following the existing layered architecture and conventions.

## Primary Goal

Produce correct, maintainable API changes by:
1. Asking requirement questions first
2. Creating a concrete implementation plan
3. Implementing by layer in the correct project locations

## Project Architecture Map

- Router layer: `internal/router/v1/*.go` and `internal/router/v1/v1.go`
- Handler layer: `internal/handler/*.go` and `internal/handler/handlers.go`
- Service layer: `internal/service/*.go` and `internal/service/services.go`
- Repository layer: `internal/repository/*.go` and `internal/repository/repositories.go`
- Domain/data models: `internal/model/*.go` (and `internal/users/models.go` for user entity)
- Shared error responses: `internal/errs/*.go`, helper wiring in `internal/handler/handlers.go`

## Required Workflow

### 1) Requirement Discovery (Ask First)

Before coding, ask focused questions that materially affect design. Collect at least:

1. Resource and business goal
2. Endpoints to add/change (method + path)
3. Request payload/query/path params
4. Response shape and status codes
5. Auth requirements (public vs authenticated)
6. Validation rules and constraints
7. Data persistence needs (new table/columns or existing schema)
8. Error cases and expected messages
9. Pagination/filter/sort behavior (if listing)
10. Backward compatibility requirements

If the user is unsure, propose sensible defaults and clearly label them as assumptions.

### 2) Planning (Before Edits)

After requirement answers, provide a file-by-file plan that includes:

- Route registration updates in `internal/router/v1`
- Handler method signatures and request/response DTOs
- Service methods and business rules
- Repository queries/transactions and data mapping
- Model updates in `internal/model` (or existing domain package)
- Constructor/wiring updates in `handlers.go`, `services.go`, `repositories.go` if needed
- Swagger annotation updates on handlers when adding endpoints
- Validation and error mapping strategy using existing `errs` patterns
- Test plan (unit + integration touchpoints)

Do not start implementation until the plan is complete.

### 3) Implementation Order

Implement in this order unless task requires otherwise:

1. `model` changes
2. `repository` methods
3. `service` logic
4. `handler` endpoints + request parsing/response writing
5. `router` registration
6. dependency wiring updates
7. tests and verification

## Coding Conventions for This Repo

- Use `writeJSON` and `writeError` patterns from `internal/handler/handlers.go`
- Wrap internal errors with context (`fmt.Errorf("...: %w", err)`)
- Return user-facing HTTP errors via `errs` helpers where appropriate
- Keep handlers thin, business logic in services, SQL/data logic in repositories
- Preserve naming/style used in existing handlers and services
- Use request context (`r.Context()` / `context.Context`) through service boundaries

## Output Format for Each Task

When invoked, always respond in three phases:

1. **Requirements Questions**
2. **Implementation Plan**
3. **Execution Summary** (after coding): files changed, behavior added, and verification run

If blocked by missing critical requirements, pause after Phase 1 and wait for answers.

## Quality Checks

Before finishing:

- Ensure route is mounted via `RegisterV1Routes` flow
- Ensure new handler is wired in `Handlers` struct when needed
- Ensure service and repository constructors are updated consistently
- Ensure responses and errors are JSON and consistent with existing API style
- Run relevant Go tests and/or build commands

## Reference Docs

- Architecture and planning checklist: `references/architecture-checklist.md`
