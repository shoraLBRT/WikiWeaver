# TODO: Article Infobox

## Goal
Add an infobox block to the article page that displays structured article facts in the new design language.

## Why It Matters
- Gives articles a strong visual anchor.
- Supports fast scanning of important facts.
- Matches the target look-and-feel from `WikiWeaver.react2`.

## Current Status
- `WikiWeaver.react2/src/app/components/ArticleInfobox.tsx` is static and domain-specific.
- `wikiweaver.react` has no infobox data model.
- The current API returns only title and paragraph content for article reading.

## First Iteration Scope
- Keep the infobox area in the new article design.
- Render a placeholder shell with explanatory text.
- Avoid domain-specific hardcoded rows.

## Proposed UX
- Title section at top of the infobox.
- Structured rows below it.
- Optional expand/collapse behavior for long metadata sets.
- Placeholder message when no infobox is configured.

## Frontend Work
- Create an `ArticleInfoboxPanel` component.
- Define a neutral data model:

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
  - `not-supported-yet`
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
1. Create infobox placeholder component in the new article page.
2. Define generic infobox types in frontend domain models.
3. Extend backend article model and DTOs with generic metadata fields.
4. Add API serialization and mapping.
5. Build a view-model mapper for article page rendering.
6. Render infobox rows with graceful empty handling.
7. Add authoring support in create/edit flows later.
8. Add tests for placeholder and populated states.

## Risks
- Domain-neutral design may become too generic without editorial rules.
- Rich infobox content may require formatting rules beyond plain text.
- If editing is added later, validation rules must stay generic but predictable.

## Definition of Done
- Placeholder is visible in iteration one.
- Generic infobox contract is documented.
- Later implementation can be connected without redesigning article page layout.

## Open Questions
- Should infobox values support markdown, links, or only plain text?
- Do we need ordering controls for infobox fields?
- Should infobox title be separate from article title?
