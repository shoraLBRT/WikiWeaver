# WikiWeaver Frontend Design Migration Plan

## Objective
Migrate `wikiweaver.react` to the visual design of `WikiWeaver.react2` while preserving the real application behavior already implemented in `wikiweaver.react` and the current API integration provided by `WikiWeaver.MinimalApi`.

## Strategic Decisions
- `wikiweaver.react` remains the target application.
- `WikiWeaver.react2` is treated as a design reference, not as a production base.
- Ant Design will be fully removed from `wikiweaver.react`.
- Tailwind will become the primary styling system.
- Missing features from the mock design will ship as styled placeholders in the first iteration.
- New code should be organized by domain responsibility, not by generated mock structure.

## Non-Goals For First Iteration
- Full implementation of related links.
- Full implementation of infobox data authoring.
- Full implementation of metadata persistence.
- Full implementation of edit-existing-article save flow.
- Replacing or redesigning the backend unless required for later iterations.

## Source Of Truth
- Behavior and data flow: `wikiweaver.react`
- Visual language and layout: `WikiWeaver.react2`
- API contract and permissions: `WikiWeaver.MinimalApi`

## Main Constraints
- Current API mainly supports navigation tree, article content reading, article creation, paragraph CRUD, admin auth, and AI/admin actions.
- The new visual mock contains static domain-specific examples that must be generalized for WikiWeaver.
- The first iteration must avoid fake persistence for not-yet-implemented features.

## Architecture Direction
Recommended frontend structure inside `wikiweaver.react/src`:

```text
app/
  providers/
  router/
layouts/
domains/
  article/
    components/
    pages/
    model/
    api/
  editor/
    components/
    pages/
    model/
    api/
  admin/
    components/
    pages/
    model/
    api/
shared/
  api/
  ui/
  lib/
  styles/
```

Rules:
- API DTOs stay close to the API layer.
- UI consumes view models, not raw DTOs.
- Reusable visual primitives live in `shared/ui`.
- Page-specific composition stays in domain folders.

## Migration Phases

### Phase 0: Foundation And Safety Net
Goal: prepare the project for a controlled UI rewrite.

Tasks:
- Add Tailwind to `wikiweaver.react`.
- Keep current build working during migration.
- Inventory all Ant Design usage and map replacement targets.
- Create a migration branch strategy and keep changes atomic.
- Add placeholder TODO docs for missing product features.

Deliverables:
- Tailwind configured and loaded.
- Documented feature TODO files.
- Clear list of Ant Design components to replace.

Exit Criteria:
- App still builds.
- Tailwind utilities can be used in the existing app.
- No production behavior changed yet.

### Phase 1: Design System Extraction
Goal: reproduce the visual language of `WikiWeaver.react2` in maintainable form.

Tasks:
- Extract color palette, font setup, spacing scale, shadows, borders, radius, and typography from `WikiWeaver.react2`.
- Move these into shared styles and Tailwind theme tokens.
- Replace inline visual constants with reusable semantic classes and tokens.
- Build basic reusable primitives:
  - `Button`
  - `Input`
  - `TextArea`
  - `Card`
  - `Panel`
  - `Badge`
  - `EmptyState`
  - `LoadingState`
  - `ErrorState`
  - `ModalShell`

Deliverables:
- Shared design tokens.
- Shared font imports.
- Base UI primitives that match the new design.

Exit Criteria:
- New UI primitives can visually reproduce the core `react2` styling.
- No new screen depends on Ant Design primitives.

### Phase 2: App Shell Migration
Goal: replace the global application frame with the new design shell.

Tasks:
- Rebuild `MainLayout` using Tailwind.
- Recreate the `react2` header style with WikiWeaver branding and real navigation behavior.
- Rebuild the left sidebar with the new visuals but keep real navigation tree data and search.
- Define a right-sidebar slot for article-specific panels.
- Add responsive behavior for mobile and tablet instead of copying the fixed desktop-only approach exactly.

Deliverables:
- New header.
- New left navigation panel.
- New content shell.

Exit Criteria:
- Existing routes still work.
- Navigation search still works.
- The old Ant Design `Layout`, `Header`, `Sider`, and related styles are gone.

### Phase 3: Article Page Migration
Goal: ship the core reading experience in the new design.

Tasks:
- Rebuild article page composition based on `WikiWeaver.react2/src/app/pages/ArticlePage.tsx`.
- Keep existing data loading from `/articles/{id}/content` and `/navigationTree/tree`.
- Map API paragraphs into a clean article view model.
- Replace the current paragraph alternative controls with a new versioned-block design.
- Use neutral labels instead of mazhab-specific language.
- Keep breadcrumbs dynamic from the real navigation tree.
- Add right sidebar sections:
  - dynamic table of contents if possible from rendered content,
  - related links placeholder,
  - metadata placeholder.
- Add infobox placeholder in the main article area.

Deliverables:
- New article page matching target visual language.
- Real content rendered from API.
- Styled placeholders for not-yet-implemented side features.

Exit Criteria:
- Article reading works on real data.
- Breadcrumbs work.
- Paragraph alternatives still work.
- Page looks like the design reference.

### Phase 4: Create Article Page Migration
Goal: merge the real create flow with the new editor visual system.

Tasks:
- Replace the current create page UI with a Tailwind-based editor shell inspired by `WikiWeaver.react2/src/app/pages/EditPage.tsx`.
- Preserve current creation logic:
  - article title,
  - parent article id,
  - paragraph groups,
  - default alternative,
  - markdown import,
  - AI styling for one or all alternatives,
  - save to `/articles/content`.
- Extract a shared editor state model so create and future edit can reuse the same logic.
- Replace the current simple editor controls with a more coherent toolbar and section layout.
- Avoid implementing fake preview unless it actually renders meaningful output.

Deliverables:
- New create article page in target design.
- Shared editor domain model.

Exit Criteria:
- Creating an article still works end-to-end.
- AI styling still works.
- Import markdown still works.
- No Ant Design form/card/button dependencies remain on this page.

### Phase 5: Admin Login And Admin Panel Restyle
Goal: preserve all admin capabilities while aligning visuals with the new design.

Tasks:
- Restyle `AdminLoginPage` in the new language.
- Restyle `AdminPage` sections:
  - content management,
  - cleanup flow,
  - AI settings,
  - invite token generation,
  - article UI mode settings if still needed.
- Replace Ant Design tables, tabs, forms, modals, alerts, and switches.
- Keep behavior unchanged unless simplification is safe.
- Decide whether paragraph UI mode remains a user preference or becomes obsolete after the new article page is complete.

Deliverables:
- Working Tailwind-based admin screens.
- Preserved auth/admin flows.

Exit Criteria:
- Admin can log in, manage content, configure AI, and generate invite tokens.
- No Ant Design remains in admin pages.

### Phase 6: Ant Design Removal And Cleanup
Goal: fully remove the old UI framework and dead code.

Tasks:
- Remove Ant Design dependencies from `package.json`.
- Delete obsolete theme configuration and CSS modules that are no longer used.
- Remove dead constants and layout code tied to Ant Design.
- Re-run the app and verify style regressions.

Deliverables:
- Clean dependency graph.
- No mixed design system debt.

Exit Criteria:
- `antd` imports are fully gone.
- The app builds and runs without Ant Design.

### Phase 7: Placeholder Feature Framework
Goal: make future features visible in UI without pretending they are complete.

Tasks:
- Add styled placeholders for:
  - related links,
  - infobox,
  - metadata,
  - edit existing article content.
- Link each placeholder implementation to its TODO markdown document.
- Ensure placeholders clearly communicate "planned" state.

Deliverables:
- Honest placeholders in the product.
- Product roadmap captured close to the codebase.

Exit Criteria:
- Missing features are visible, styled, and documented.
- No misleading fake-save interactions remain.

### Phase 8: Edit Existing Content Implementation
Goal: implement the real edit flow after the first design migration lands.

Tasks:
- Extend API with update-content support if required.
- Reuse shared editor state from create flow.
- Load existing article into the editor.
- Save updates and refresh article/admin/navigation queries.

This phase depends on `docs/todo/frontend-edit-content.md`.

### Phase 9: Rich Article Enhancements
Goal: connect placeholders to real domain data.

Tasks:
- Implement metadata storage and rendering.
- Implement infobox storage and rendering.
- Implement related links.
- Improve TOC generation if needed.

This phase depends on:
- `docs/todo/frontend-related-links.md`
- `docs/todo/frontend-infobox.md`
- `docs/todo/frontend-metadata.md`

## Component Replacement Guide

### Replace Ant Design Components
- `Layout`, `Header`, `Sider`, `Content` -> custom Tailwind layout components
- `Button` -> shared `Button`
- `Input`, `InputNumber`, `TextArea`, `Input.Search`, `Input.Password` -> shared form primitives
- `Card` -> shared `Card`
- `Tabs` -> custom tabs
- `Table` -> simple custom table or headless table pattern
- `Modal` -> custom modal shell
- `Alert` -> shared alert/notice component
- `Spin` -> shared loader component
- `Switch`, `Segmented`, `Radio`, `Popconfirm`, `Tooltip`, `Breadcrumb` -> custom/headless equivalents

## Risks And Mitigations

### Risk: Tailwind Migration Scope Expands Too Much
Mitigation:
- Replace screen by screen.
- Remove Ant Design only after each migrated area is stable.

### Risk: Visual Copy Introduces Bad Generated Code Patterns
Mitigation:
- Copy design language, not generated structure.
- Avoid bringing over unused `ui/*` generated components wholesale.

### Risk: Article Data Model Does Not Match Mock Layout
Mitigation:
- Use a dedicated view-model layer.
- Ship placeholders where backend support does not exist.

### Risk: Mobile Layout Breaks
Mitigation:
- Design responsive behavior explicitly during shell migration.
- Do not clone fixed widths from `react2` without adaptation.

### Risk: Create And Future Edit Flows Diverge
Mitigation:
- Build a shared editor model before implementing real edit-save.

### Risk: Admin Rework Delays Core Reading Experience
Mitigation:
- Prioritize article page and create page before admin polish.

## Testing Strategy Per Phase
- Phase 0-2: verify app boots, routing works, navigation loads.
- Phase 3: verify article reading, breadcrumbs, alternative switching, empty/loading/error states.
- Phase 4: verify create article happy path, validation, markdown import, AI styling.
- Phase 5: verify admin auth, article deletion, paragraph deletion, AI settings, invite token flow.
- Phase 6+: run full build and affected smoke tests.

## Recommended Work Order For Implementation Sessions
1. Tailwind setup and design tokens.
2. New shell and left navigation.
3. New article page.
4. New create page.
5. Admin login and admin panel.
6. Remove Ant Design.
7. Add placeholders and polish.
8. Move on to real edit/metadata/infobox/related links.

## Definition Of Success For The First Migration Iteration
- The application visually matches the direction of `WikiWeaver.react2`.
- Real reading and article creation workflows continue to function.
- Admin workflows remain available.
- Ant Design is removed.
- Missing features are represented by honest, styled placeholders and documented TODO files.
