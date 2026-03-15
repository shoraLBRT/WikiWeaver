# TODO: Related Links

## Goal
Add a "Related Links" block to the article page that shows contextually relevant wiki links based on real article data instead of static mock content.

## Why It Matters
- Helps users continue reading adjacent topics.
- Makes the right sidebar useful beyond table of contents navigation.
- Moves the product closer to the visual and information architecture shown in `WikiWeaver.react2`.

## Current Status
- `WikiWeaver.react2` contains static related links in `WikiWeaver.react2/src/app/components/RightSidebar.tsx`.
- `wikiweaver.react` has no real related-links model, UI, or API contract.
- First iteration should render a styled placeholder block in the new design.

## First Iteration Scope
- Show a placeholder card in the right sidebar.
- Explain that related links are not configured yet.
- Keep the component API stable so data can be connected later without redesign.

## Proposed UX
- Title: "Related Articles".
- When data is unavailable, show 1-2 lines of muted helper text.
- When data is available later, show a short list of links with article titles.

## Frontend Work
- Create `RelatedLinksPanel` component in the new article sidebar.
- Accept a typed view model, for example:

```ts
type RelatedLinkItem = {
  id: number;
  title: string;
  href: string;
};
```

- Support three states:
  - `loading`
  - `empty`
  - `ready`
- Render a placeholder in `empty` state during first iteration.

## Backend / Data Options
### Option A: Manual metadata on article
- Add related article ids to article metadata.
- Best when authors curate relationships manually.

### Option B: Automatic suggestions
- Generate related links by parent category, tags, or shared metadata.
- Better for scale, but requires richer article metadata.

### Recommended Path
- Start with manual metadata later.
- Do not implement recommendation logic before metadata exists.

## Suggested API Evolution
- Extend article content response with:

```json
{
  "relatedLinks": [
    { "id": 12, "title": "Another Article" }
  ]
}
```

or provide a dedicated endpoint:

`GET /articles/{id}/related`

## Implementation Algorithm
1. Create a placeholder sidebar component in the new article layout.
2. Add a stable TypeScript interface for related links in the frontend domain layer.
3. When backend work begins, add the DTO to the API response or dedicated endpoint.
4. Map DTO data into the article page view model.
5. Render related links with loading, empty, and ready states.
6. Add navigation and click behavior.
7. Add tests for empty and populated states.

## Risks
- No existing metadata model to infer related links from.
- Auto-generated links may be low quality without taxonomy/tags.
- If added directly into article DTO too early, API contracts may become unstable.

## Definition of Done
- Placeholder exists in iteration one.
- Real data contract is documented.
- Future implementation path is clear.
- Later production version renders real links from API.

## Open Questions
- Should related links be manually curated or automatically suggested?
- Should they support nested wiki spaces/projects in the future?
- Should ordering be editorial or algorithmic?
