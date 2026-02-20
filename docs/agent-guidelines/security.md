# Security Guidelines

## Secrets and credentials
- Never hardcode secrets, tokens, passwords, or private keys.
- Use environment variables or secret managers.
- Do not commit `.env` files with real values.

## Input and validation
- Treat all external input as untrusted.
- Validate and sanitize input at system boundaries.
- Enforce allowlists where possible.

## Authentication and authorization
- Enforce authentication before sensitive operations.
- Check authorization at the business action level, not only at routing level.
- Follow least-privilege principles for service accounts and API keys.

## Data protection
- Avoid storing sensitive data unless necessary.
- Mask sensitive fields in logs.
- Use transport encryption (HTTPS/TLS) for external communication.

## Dependency hygiene
- Prefer well-maintained dependencies.
- Avoid adding dependencies for trivial utilities.
- Track and patch known vulnerabilities.

## Security review checklist
- No secret leaks in code, config, logs, or tests.
- No new unsafe deserialization or dynamic code execution paths.
- Errors do not expose internal implementation details.
