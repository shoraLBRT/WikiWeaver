# TODO: Edit Existing Article Content

## Goal
Implement a real article editing flow for existing content using the new editor design and live API integration.

## Why It Matters
- Editing existing articles is a core capability for any wiki platform.
- The route already exists in `wikiweaver.react`, but it is still a placeholder.
- The generated editor in `WikiWeaver.react2` is visually close to the desired UX.

## Current Status
- `wikiweaver.react/src/pages/EditArticlePage.tsx` is a stub.
- `WikiWeaver.react2/src/app/pages/EditPage.tsx` is a mock editor with no persistence.
- Current API supports article creation with content, but no obvious full article-content update endpoint.

## First Iteration Scope
- Keep the route in the new design.
- Replace the stub with a styled placeholder page that explains editing is planned.
- Do not fake editing behavior that looks saved when it is not.

## Required Backend Work
- Add a real endpoint for fetching editable article content if current read DTO is insufficient.
- Add a real endpoint for updating article title, parent, paragraphs, alternatives, and defaults.

## Suggested API Evolution
- `GET /articles/{id}/content` may remain as read source if sufficient.
- Add one of:
  - `PUT /articles/{id}/content`
  - `PATCH /articles/{id}/content`

Suggested payload shape:

```json
{
  "title": "Article title",
  "parentArticleId": 10,
  "paragraphs": [
    { "id": 101, "content": "...", "order": 1, "isDefault": true }
  ]
}
```

## Frontend Work
- Reuse the new editor shell from the create-article page.
- Add article-loading state based on route id.
- Hydrate editor state from existing content.
- Support save mutation and optimistic/confirmed success messaging.
- Reuse markdown import and AI styling where appropriate.

## Implementation Algorithm
1. Replace the current edit stub with a clear placeholder in the new design.
2. Design a shared editor state model used by both create and edit pages.
3. Add frontend mapper from article DTO to editor state.
4. Implement backend update endpoint and validation.
5. Implement frontend save mutation for edit mode.
6. Invalidate article, navigation tree, and admin queries after success.
7. Add tests for load, save, validation, and failure states.

## Risks
- Updating alternatives and default flags is easy to break without strong validation.
- Reordering paragraphs requires deterministic id/order handling.
- Partial save semantics must be defined clearly.
- Without shared editor state, create and edit pages will diverge quickly.

## Definition of Done
- Placeholder exists in iteration one.
- Shared editor state architecture is planned before implementation.
- Real edit flow saves through API and refreshes affected views.

## Open Questions
- Should editing support drafts before publish?
- Do we need concurrency protection for simultaneous edits?
- Should paragraph ids remain stable across reorder operations?
