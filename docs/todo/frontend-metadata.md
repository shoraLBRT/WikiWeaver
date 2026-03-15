# TODO: Article Metadata

## Goal
Introduce article metadata blocks for the reading experience and future editorial workflows.

## Why It Matters
- Metadata supports sorting, filtering, discovery, and editorial context.
- It unlocks future features such as related links, revision summaries, and article status.
- The target design already implies metadata presence in the right sidebar and editor.

## Current Status
- `WikiWeaver.react2` shows static metadata examples in the article sidebar and editor.
- `wikiweaver.react` does not expose article metadata beyond title, parent id, and content presence.
- API contracts do not currently support metadata.

## First Iteration Scope
- Render a placeholder metadata section in the article sidebar.
- Do not persist metadata yet.
- Document the future data contract now.

## Recommended Metadata Set
- `category`
- `tags`
- `lastModifiedUtc`
- `revisionCount`
- `summary`
- `status` (draft/published/archived)

## Frontend Work
- Create `ArticleMetadataPanel` for article page sidebar.
- Create a metadata view model:

```ts
type ArticleMetadataViewModel = {
  category?: string;
  tags: string[];
  lastModifiedUtc?: string;
  revisionCount?: number;
  summary?: string;
  status?: 'draft' | 'published' | 'archived';
};
```

- In the first iteration, show placeholder values or a "Metadata will appear here" state.

## Backend / Data Options
### Option A: Extend article entity directly
- Simpler initially.
- Good for small metadata sets.

### Option B: Add dedicated metadata object/table
- More scalable if metadata grows.
- Better if per-field history or optional schemas are needed.

### Recommended Path
- Start simple by extending article metadata storage directly.
- Revisit dedicated metadata storage only if editing/versioning becomes complex.

## Suggested API Evolution
- Extend article DTOs with metadata fields.
- Ensure `GET /articles/{id}/content` returns enough metadata for the read page.
- Ensure create/edit endpoints accept metadata later.

## Implementation Algorithm
1. Create placeholder metadata panel in article sidebar.
2. Define shared metadata types in frontend domain layer.
3. Extend backend DTOs and persistence model when implementation starts.
4. Map backend metadata to frontend view model.
5. Render formatting helpers for date, tags, status, and revision count.
6. Expose metadata inputs in editor/create flow.
7. Add tests for empty and populated metadata states.

## Risks
- Metadata often expands over time and can become inconsistent without conventions.
- Dates and status labels require localization decisions.
- Revision count implies future revision history support that may not exist yet.

## Definition of Done
- Placeholder metadata block exists in iteration one.
- Future metadata contract is defined.
- The chosen fields support related links and richer article presentation later.

## Open Questions
- Which metadata fields are mandatory for all wiki domains?
- Do we need article status before edit/review workflows exist?
- Should tags be free-text or managed taxonomy?
