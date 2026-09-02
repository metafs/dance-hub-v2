# ADR-0012: Use authored global CSS for the MVP frontend

**Status:** Accepted
**Accepted:** 2026-09-03

## Context

The MVP interface uses semantic component class names and one hand-authored global stylesheet. Tailwind CSS was installed and imported, but the application did not use its utility classes consistently; the few utility-like classes in the root layout duplicated global page rules. Keeping both approaches made the styling source of truth unclear and retained unused build tooling.

The interface contains Japanese and Latin text. Next.js supplies Geist for Latin glyphs, but the stylesheet previously selected Arial instead, so the loaded font was not used and Japanese fallback behavior was implicit.

## Decision

Use `src/app/globals.css` as the single styling source for the MVP. Components use semantic class names backed by authored CSS. Do not include Tailwind CSS or its PostCSS plugin unless a later decision replaces this approach.

Apply the Geist Sans variable to body text and the Geist Mono variable to code-like elements. Follow Geist Sans with an explicit Japanese system sans-serif stack so unsupported Japanese glyphs render with an appropriate locally available font.

## Alternatives considered

- Convert the existing interface to Tailwind utilities: rejected because it would rewrite working styles without adding MVP behavior.
- Keep Tailwind alongside authored CSS: rejected because no current component needs Tailwind and two styling paths obscure ownership.
- Add a hosted Japanese web font: deferred because it adds payload and an external font choice that the product has not required.

## Consequences

- Styling changes remain dependency-free and are reviewed in one stylesheet.
- The root layout no longer depends on utility classes for foundational layout or font smoothing.
- Japanese typography varies slightly by operating system while preferring common native Japanese sans-serif fonts.
- A future design-system or utility-framework migration requires an explicit replacement decision and a coherent component migration.

## Revisit when

- Repeated component patterns make the global stylesheet difficult to maintain.
- A documented design system requires scoped styles, tokens, or a component styling tool.
- Product typography requires a consistent downloadable Japanese font across platforms.
