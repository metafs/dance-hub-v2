import type { ReactNode } from "react";

/**
 * A titled block. The h2 is a direct child of the <section>, so with an `id`
 * the section is a named region and the heading's parent is the section itself.
 */
export function Section({
  id,
  title,
  aside,
  size = "large",
  rule = false,
  className,
  children,
}: {
  id?: string;
  title: ReactNode;
  aside?: ReactNode;
  size?: "large" | "small";
  rule?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const classes = [
    "section",
    size === "small" ? "section-small" : null,
    rule ? "section-rule" : null,
    className,
  ].filter(Boolean).join(" ");

  return (
    <section aria-labelledby={id} className={classes}>
      <h2 id={id}>{title}</h2>
      {aside ? <div className="section-aside">{aside}</div> : null}
      {children}
    </section>
  );
}
