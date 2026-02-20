# Commit Guidelines

## Format
Use Conventional Commits:
- `feat:` new functionality
- `fix:` bug fixes
- `refactor:` internal restructuring without behavior change
- `test:` tests only
- `docs:` documentation only
- `chore:` maintenance/tooling

Examples:
- `docs: add baseline AGENTS and agent guidelines`
- `fix(api): validate node parent before update`

## Scope and size
- Keep commits atomic and logically grouped.
- One commit should represent one coherent intent.
- Avoid mixing formatting-only changes with functional changes.

## Message quality
- Use imperative mood ("add", "update", "remove").
- Explain _what_ changed; optionally include _why_ if not obvious.
- Reference issue/task IDs when available.

## Pre-commit checklist
- Relevant tests pass.
- No secrets or credentials included.
- No generated noise files unless required.
