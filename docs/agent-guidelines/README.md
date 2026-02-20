# Agent Guidelines

This folder contains universal engineering instructions that can be followed by both humans and coding agents.

## Documents
- `coding-style.md` — conventions for naming, structure, formatting, and maintainability.
- `testing.md` — testing strategy, test quality bar, and execution rules.
- `commits.md` — commit message standard and change-set hygiene.
- `security.md` — secure coding rules and review checklist.
- `pr.md` — pr message standard.

## How to use
1. Read this file first.
2. Apply relevant rules from each topic-specific document.
3. If rules conflict, prefer:
   - explicit task instructions,
   - then `AGENTS.md`,
   - then these topic documents.

## Definition of Done (DoD)
A change is done when:
- code follows style conventions,
- tests are added/updated and pass,
- no avoidable security regressions are introduced,
- commit history is clear and conventional,
- docs are updated when behavior changes.
