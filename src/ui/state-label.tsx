import type { ReactNode } from "react";

export type StateLabelTone = "outline" | "solid" | "quiet" | "dashed";

/**
 * A short state word such as 中止 or 下書き. The palette is achromatic, so the
 * tone is carried by the label's form: solid, outlined, quiet or dashed.
 */
export function StateLabel({
  tone = "outline",
  children,
}: {
  tone?: StateLabelTone;
  children: ReactNode;
}) {
  const className = tone === "outline" ? "state-label" : `state-label state-label-${tone}`;
  return <span className={className}>{children}</span>;
}

export type MarkShape = "open" | "filled" | "square";

/** A small leading shape and a word, for a state read down a table column. */
export function Mark({ shape, children }: { shape: MarkShape; children: ReactNode }) {
  const className = shape === "open" ? "mark" : shape === "filled" ? "mark mark-filled" : "mark mark-square";
  return <span className={className}>{children}</span>;
}
