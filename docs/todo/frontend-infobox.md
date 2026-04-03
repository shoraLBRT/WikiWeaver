# TODO: Article Infobox

## Goal
Add an infobox block to the article page that displays structured article facts in the new design language.

## Why It Matters
- Gives articles a strong visual anchor.
- Supports fast scanning of important facts.
- Matches the target look-and-feel from `WikiWeaver.react2`.

## Current Status
- `wikiweaver.react` now renders a real infobox from article content DTOs.
- The create-article flow now supports authoring infobox title, subtitle, and ordered fields.
- The backend stores infobox data as ordered article fields and returns them from `/articles/{id}/content`.
- Editing existing article infoboxes is still deferred with the broader edit-content task.

## Implemented Scope
- Keep the infobox area in the new article design.
- Persist a generic ordered key-value infobox per article.
- Render populated and configured-empty states without domain-specific hardcoded rows.
- Support infobox authoring in the create-article flow.

## Remaining Scope
- Add infobox editing for existing articles.
- Decide whether rich formatting or links are needed inside values.
- Add automated tests once the repository test harness is introduced.

## Proposed UX
- Title section at top of the infobox.
- Structured rows below it.
- Optional expand/collapse behavior for long metadata sets.
- Placeholder message when no infobox is configured.

## Frontend Work
- Keep `ArticleInfoboxPanel` as the reader-facing component.
- Keep a neutral data model:

```ts
type InfoboxField = {
  key: string;
  label: string;
  value: string;
};

type ArticleInfoboxViewModel = {
  title?: string;
  subtitle?: string;
  fields: InfoboxField[];
};
```

- Support states:
  - `not-configured`
  - `configured-empty`
  - `ready`

## Backend / Data Options
### Option A: Generic key-value metadata
- Flexible and reusable for any wiki domain.
- Recommended for WikiWeaver.

### Option B: Strongly typed infobox schema
- Better validation, but less flexible across multiple wiki domains.

### Recommended Path
- Start with generic key-value fields stored per article.

## Suggested API Evolution
- Extend article content DTO with:

```json
{
  "infobox": {
    "title": "...",
    "subtitle": "...",
    "fields": [
      { "key": "type", "label": "Type", "value": "..." }
    ]
  }
}
```

## Implementation Algorithm
1. Extend backend article persistence with infobox title, subtitle, and ordered fields.
2. Add create/read DTO support and API mapping.
3. Render the real infobox on the article page with overflow handling.
4. Add infobox authoring to the create-article flow.
5. Keep edit support as a follow-up under `docs/todo/frontend-edit-content.md`.
6. Add tests once the repository-level test setup is available.

## Risks
- Domain-neutral design may become too generic without editorial rules.
- Rich infobox content may require formatting rules beyond plain text.
- If editing is added later, validation rules must stay generic but predictable.

## Definition of Done
- Generic infobox contract is documented.
- Articles can be created with infobox data and read back without redesigning article page layout.
- The implementation remains domain-neutral and ready for future edit support.

## Open Questions
- Should infobox values support markdown, links, or only plain text?
- Do we need ordering controls for infobox fields?
- Should infobox title be separate from article title?
