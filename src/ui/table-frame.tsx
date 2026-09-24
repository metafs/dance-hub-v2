import type { ReactNode } from "react";

/**
 * A table that scrolls sideways inside its frame on narrow screens rather
 * than squeezing its columns (docs/design/ui.md). The frame is focusable and
 * named, so a keyboard user can scroll it and a screen reader says what it
 * holds (WCAG 2.1.1).
 */
export function TableFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-label={label} className="table-wrap" role="region" tabIndex={0}>
      {children}
    </div>
  );
}
