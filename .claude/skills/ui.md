---
name: WikiWeaver UI Guidelines
description: Design system and development workflow for WikiWeaver React components. Auto-apply when working in wikiweaver.react/. Use Tailwind v4, CSS variables, project design tokens, and Playwright for visual verification of non-trivial changes.
triggers:
  - wikiweaver.react/
  - React component
  - frontend
  - AdminPage
  - NavigationTree
  - UI changes
---

# WikiWeaver UI Guidelines

This skill constrains my design output to match WikiWeaver's established design system. Use this skill when building React components, pages, or interface updates.

## Design Direction

WikiWeaver has a warm, scholarly aesthetic: a knowledge wiki with parchment-like backgrounds and forest-green brand accents. Design should feel intentional, readable, and hierarchical — appropriate for a knowledge platform.

## Color Palette (Use CSS Variables ALWAYS)

Never hardcode hex colors. Use these variables from `theme.css`:

**Backgrounds:**
- `--color-page-bg: #fafaf8` — main page background (warm off-white)
- `--color-page-panel: #f4f3ee` — secondary panel background
- `--color-surface: #ffffff` — card/surface white
- `--color-surface-muted: #fafaf8` — muted surface

**Brand Color (Forest Green):**
- `--color-brand-forest: #2d6a4f` — primary brand color
- `--color-brand-forest-strong: #1f513a` — darker variant
- `--color-brand-forest-soft: #eef7f2` — light tint

**Text (Ink Scale):**
- `--color-ink-strong: #1c1b18` — headings, strong text
- `--color-ink-default: #2c2b26` — body text
- `--color-ink-muted: #6b6a65` — secondary text
- `--color-ink-subtle: #9b9a95` — tertiary/disabled text

**Borders & Effects:**
- `--color-border-soft: #e2e1dc` — primary border
- `--color-border-mute: #eeede8` — subtle border
- `--shadow-soft: 0 20px 70px rgba(28, 27, 24, 0.08)` — soft shadow

**Usage in Tailwind:**
```tsx
<div className="bg-[var(--color-surface)] text-[var(--color-ink-default)]">
  <h1 className="text-[var(--color-ink-strong)]">Title</h1>
</div>
```

## Typography

WikiWeaver loads these fonts via `fonts.css`:

- **`--font-sans: 'Inter', sans-serif`** — UI, body text, controls
- **`--font-serif: 'Amiri', serif`** — article content, long-form reading

Use Tailwind's `font-sans` / `font-serif` classes. Never hardcode font names or load external fonts.

**Font Pairing:**
- Headings: `font-sans` with `font-weight: 600` (`font-semibold`)
- Body: `font-sans` with `font-weight: 400` (`font-normal`)
- Article prose: `font-serif` for visual distinction

## Spacing & Layout

**Predefined variables:**
- `--layout-header-height: 48px`
- `--layout-sidebar-width: 240px`
- `--layout-right-sidebar-width: 220px`
- `--radius-card: 18px` — card border-radius
- `--radius-pill: 999px` — pill-shaped elements

Use Tailwind spacing utilities (`p-4`, `m-8`, `gap-6`, etc.) with the existing layout tokens for consistency.

## Custom Utilities (Available)

Two custom Tailwind utilities already defined:

**`@utility surface-card`**
```css
background: color-mix(in srgb, var(--color-surface) 92%, transparent);
border: 1px solid var(--color-border-soft);
border-radius: var(--radius-card);
box-shadow: var(--shadow-soft);
```
Use: `className="surface-card"`

**`@utility panel-muted`**
```css
background: var(--color-page-panel);
border: 1px solid var(--color-border-soft);
```
Use: `className="panel-muted"`

Apply these instead of building shadows + borders manually.

## Components & Icons

**Icons:** Use `lucide-react` — it's installed. Never load Icon fonts or inline SVGs.
```tsx
import { Check, ChevronDown, Search } from 'lucide-react';
<Check size={20} className="text-[var(--color-brand-forest)]" />
```

**Interactive Elements:**
- Links: inherit color, use `transition-colors` for hover states
- Buttons: use forest-green (`--color-brand-forest`) for primary actions
- Inputs: border with `--color-border-soft`, focus ring with `--color-focus-ring`

## Motion & Animation

No `framer-motion` or Motion library is installed. Use CSS-only animations:

- **Transitions:** Tailwind's `transition-*` utilities (`transition-colors`, `transition-transform`)
- **Animations:** Tailwind's `animate-*` (`animate-pulse`, `animate-spin`)
- **Custom animations:** Define in `index.css` or inline with `@keyframes` in components

Prefer:
- Subtle hover/focus states over flashy animations
- One intentional entrance animation over scattered micro-interactions
- CSS `transition` over JavaScript animation

## Avoid (AI Slop Prevention)

❌ **Never do:**
- Hardcoded hex colors (use CSS variables)
- Generic fonts like Arial, system fonts, or Roboto
- Loading Google Fonts or external stylesheets
- framer-motion or Motion library (not installed)
- Purple gradients on white
- Overused Tailwind patterns (rounded-lg shadows on gray)
- Icon fonts or CDN SVGs

✅ **Always:**
- Use CSS variables for colors
- Use project fonts (Inter, Amiri)
- Use lucide-react for icons
- Use `surface-card` / `panel-muted` utilities
- Keep motion minimal and purposeful
- Match the warm parchment + forest-green aesthetic

## Example Component

```tsx
import { Book } from 'lucide-react';

export function ArticleCard({ title, excerpt }) {
  return (
    <div className="surface-card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <Book size={20} className="text-[var(--color-brand-forest)] flex-shrink-0 mt-1" />
        <h3 className="font-semibold text-[var(--color-ink-strong)]">{title}</h3>
      </div>
      <p className="text-sm text-[var(--color-ink-muted)] font-serif">{excerpt}</p>
    </div>
  );
}
```

Commit to this aesthetic and execute with precision.

## Development Workflow

**This skill is active during all frontend work in `wikiweaver.react/`.** Apply it automatically — no need for the user to invoke it explicitly.

### When to take Playwright screenshots

Not every change warrants a full visual verification cycle. Use judgement:

**Skip screenshots for:**
- Text/copy edits (labels, placeholders, button text)
- Trivial spacing tweaks (`p-4` → `p-3`, `gap-2` → `gap-3`)
- Single color token swaps where the intent is obvious (`--color-ink-default` → `--color-ink-muted`)
- Adding/removing a single Tailwind utility class with predictable outcome
- Logic-only changes with no visual impact

**Always take screenshots for:**
- New components or pages
- Layout changes (flex/grid structure, sidebar, header, panels)
- Interactive states (hover, active, expanded, modal open)
- Multi-element styling changes where interaction between elements matters
- Anything "close enough might not be good enough" — when you're uncertain

### Screenshot workflow

1. Ensure dev server is running: `npm run dev` (port 5173)
2. Use Playwright MCP to capture affected pages
3. Review against design system guidelines above
4. Fix any visual inconsistencies, re-screenshot until clean
5. Only then commit

### Before committing frontend changes

- [ ] Design system constraints followed (colors, fonts, spacing, icons from this skill)
- [ ] Screenshots taken if the change is visually non-trivial
- [ ] No visual bugs visible in screenshots (overflow, misalignment, wrong colors)
- [ ] Related pages still look correct (no unintended side effects)
