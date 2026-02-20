# Admin Panel MVP Plan

## Current scope implemented
- Public `/admin` page (temporary for MVP).
- Lists for nodes, articles, paragraphs.
- Deletion actions for nodes, articles, paragraphs.
- Dangerous maintenance action to delete all nodes/articles/paragraphs (`POST /admin/cleanup`).

## Explicit limitations
- No authentication/authorization yet.
- No hide/unhide operation yet.
- No move operation in navigation tree yet.

## Next iteration tasks
1. Add authentication and role-based access control for all `/admin` endpoints and UI routes.
2. Add node move operation with cycle-prevention validation.
3. Add hide/unhide flags for nodes and articles and expose them in navigation.
4. Add audit log storage for destructive actions.
5. Add integration tests that verify permissions, delete behavior, and cleanup safety checks.
