# AGENTS.md

This file defines baseline instructions for coding agents working in this repository.

## Scope
- This file applies to the entire repository unless overridden by a deeper `AGENTS.md`.
- Detailed policies live in `docs/agent-guidelines/`.

## Instruction Priority
1. System / developer / user instructions in the active session.
2. `AGENTS.md` files (nearest file in the directory tree wins).
3. Documents in `docs/agent-guidelines/`.

## Working Agreement
- Keep changes focused on the requested task.
- Prefer small, atomic commits.
- Run relevant tests before finishing.
- If behavior or contracts are changed, update documentation.

## Required Reading
Before implementing significant changes, review:
- `docs/agent-guidelines/README.md`
- `docs/agent-guidelines/coding-style.md`
- `docs/agent-guidelines/testing.md`
- `docs/agent-guidelines/commits.md`
- `docs/agent-guidelines/security.md`
