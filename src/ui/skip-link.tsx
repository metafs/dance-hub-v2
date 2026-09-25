/** The id every page gives its `<main>`, which {@link SkipLink} jumps to. */
export const mainContentId = "main-content";

/**
 * The first focusable element on every page (docs/design/ui.md, アクセシビリティ).
 * It stays out of sight until a keyboard user reaches it, then moves them past
 * the header to the page's main landmark.
 */
export function SkipLink() {
  return (
    <a className="skip-link" href={`#${mainContentId}`}>
      本文へスキップ
    </a>
  );
}
