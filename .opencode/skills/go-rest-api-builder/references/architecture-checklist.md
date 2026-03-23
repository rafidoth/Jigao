# Go REST API Architecture Checklist

Use this checklist when implementing a new endpoint or resource in this project.

## 1. Clarify Requirements

- [ ] Endpoint method and path are explicit
- [ ] Input contract is explicit (path/query/body)
- [ ] Output contract is explicit (success body, status code)
- [ ] Error cases are explicit (status + message)
- [ ] Auth requirement is explicit
- [ ] Data source/schema impact is explicit

## 2. Map Layers Before Writing Code

- [ ] Router file identified in `internal/router/v1/`
- [ ] Handler file identified in `internal/handler/`
- [ ] Service file identified in `internal/service/`
- [ ] Repository file identified in `internal/repository/`
- [ ] Model file identified in `internal/model/` (or existing domain package)
- [ ] Constructor/wiring files identified:
  - `internal/handler/handlers.go`
  - `internal/service/services.go`
  - `internal/repository/repositories.go`

## 3. Design Rules Per Layer

### Router
- Keep only path/method to handler mapping
- Keep grouping under existing resource route blocks

### Handler
- Parse and validate HTTP request data
- Call exactly one service flow for core action
- Use `writeJSON` and `writeError` helpers
- Add/update Swagger annotations for endpoint

### Service
- Enforce business rules and authorization checks
- Coordinate repository calls
- Wrap unexpected errors with context

### Repository
- Own SQL and transaction boundaries
- Map rows to model structs
- Return typed/traceable errors to service

### Model
- Keep request/response and persistence structs coherent
- Align JSON and DB tags with existing patterns

## 4. Validation and Errors

- [ ] Input validation errors map to `400`
- [ ] Auth failures map to `401`/`403`
- [ ] Missing resources map to `404`
- [ ] Domain conflicts map to `409` when relevant
- [ ] Unknown failures map to `500`
- [ ] Error response uses existing `errs` conventions

## 5. Wiring and Registration

- [ ] New repository added to `Repositories` and constructor
- [ ] New service added to `Services` and constructor
- [ ] New handler added to `Handlers` and constructor
- [ ] New routes registered in v1 router flow

## 6. Verification

- [ ] Build passes
- [ ] Tests for changed logic pass
- [ ] New endpoint manually sanity-checked (if possible)
- [ ] API contract matches requirement answers
