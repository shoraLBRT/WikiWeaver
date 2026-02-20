# Testing Guidelines

## Testing strategy
- Follow a practical test pyramid:
  - unit tests for domain logic,
  - integration tests for boundaries (DB, API, messaging),
  - end-to-end tests for critical user flows.
- Add or update tests for every behavior change.

## Test quality
- Tests must be deterministic and isolated.
- Prefer real behavior over over-mocking.
- Assert observable outcomes, not internal implementation details.

## Naming and layout
- Test names should describe scenario + expected behavior.
- Arrange tests with clear Given / When / Then structure.
- Keep fixtures minimal and reusable.

## Coverage expectations
- Cover happy paths, edge cases, and at least one failure path.
- For bug fixes, include a regression test.

## Execution
- Run only affected test suites during iteration for speed.
- Run broader checks before finalizing the change.
- If a test cannot be run due to environment limits, document it explicitly.
