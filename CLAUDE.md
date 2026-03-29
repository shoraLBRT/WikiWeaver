# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is WikiWeaver

An open-source wiki knowledge tree platform. Content is organized as a hierarchical tree of nodes (articles), each containing ordered paragraphs. Paragraphs support multiple alternatives (variants), with one marked as the default. The admin panel (`/admin`) handles all content authoring.

## Commands

### Backend (run from repo root)
```bash
dotnet restore
dotnet build
dotnet run --project WikiWeaver.MinimalApi
```

### Frontend (run from `wikiweaver.react/`)
```bash
npm install
npm run dev       # dev server on :5173
npm run build     # tsc -b && vite build
npm run lint      # eslint
npm run preview   # preview production build
```

## Architecture

Clean DDD layering — each layer depends only on layers below it:

```
WikiWeaver.Domain          → pure entities, no external dependencies
WikiWeaver.Application     → services, DTOs, AutoMapper profiles
WikiWeaver.Infrastructure  → EF Core (SQLite), repositories, Unit of Work, seeders
WikiWeaver.MinimalApi      → ASP.NET Core 8 Minimal API, JWT auth, CORS, Swagger
wikiweaver.react           → React 19 + TypeScript, React Router v7, React Query v5, Tailwind CSS v4, Vite
```

**Key domain concepts:**
- `Article` contains ordered `Paragraph`s
- Each `Paragraph` has one or more alternatives; one is marked default
- `NavigationTree` exposes the article hierarchy for the sidebar
- `AdminUser` authenticates via JWT; invite tokens bootstrap new admins

**API surface** (all in `WikiWeaver.MinimalApi/Endpoints/`):
- `/auth/*` — login, token refresh
- `/navigationTree` — tree structure
- `/articles/*` — article CRUD
- `/articleContent/*` — article with resolved paragraph defaults
- `/paragraphs/*` — paragraph and alternative operations
- `/admin/*` — admin utilities (cleanup, AI markdown styling)

**Frontend ↔ Backend:**
- Base URL configured in `wikiweaver.react/src/config.ts` (`http://localhost:5172`)
- CORS allows `localhost:5173` (Vite dev port)
- Auth token stored in `localStorage`; protected routes under `/admin/*`
- HTTP via Axios; server state via React Query

**Database:** SQLite (`wikiweaver.db`). Connection string in `WikiWeaver.MinimalApi/appsettings.json`.

## Coding conventions

- English for all code symbols; Russian may appear in comments/AI prompts — leave as-is.
- No dead code, no commented-out blocks, no TODOs without an issue reference.
- No unrelated refactors mixed into task-specific changes.
- Keep public API/DTO contracts documented.

## Commits

Use Conventional Commits:
```
feat:      new functionality
fix:       bug fixes
refactor:  internal restructuring without behavior change
test:      tests only
docs:      documentation only
chore:     maintenance/tooling
style:     formatting, no logic changes
```
Scope is optional: `fix(api): validate node parent before update`

## Testing

- Unit tests for domain logic; integration tests for DB/API boundaries.
- Prefer real behavior over mocks. Assert observable outcomes.
- Test names: describe scenario + expected result (Given/When/Then structure).
- Cover happy path, at least one edge case, and one failure path per behavior change.
- For bug fixes, add a regression test.
