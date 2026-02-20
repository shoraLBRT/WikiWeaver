# Coding Style

## Core principles
- Prefer readability over cleverness.
- Keep functions/classes small and single-purpose.
- Avoid hidden side effects.
- Use explicit names that communicate intent.

## Naming
- Use consistent language across the repository (English for code symbols).
- Names should describe domain meaning, not implementation details.
- Avoid abbreviations unless they are established and unambiguous.

## Structure
- Keep modules cohesive and low-coupled.
- Organize code by domain responsibility.
- Avoid circular dependencies.

## Error handling
- Fail fast on invalid input.
- Return actionable error messages.
- Do not swallow exceptions silently.

## Comments and docs
- Comment _why_, not _what_ (when code is already clear).
- Keep public contracts documented (API/DTO/events).
- Remove outdated comments in the same change.

## Clean code checklist
- No dead code or commented-out blocks.
- No TODOs without an issue/task reference.
- No unrelated refactors in task-specific changes.
