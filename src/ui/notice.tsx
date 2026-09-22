import type { ReactNode } from "react";

/**
 * A message about the page or the last action. Errors are announced as
 * alerts; other tones are announced only when the caller asks for a role.
 */
export function Notice({
  tone = "info",
  role,
  title,
  variant,
  children,
}: {
  tone?: "error" | "success" | "info" | "plain";
  role?: "alert" | "status";
  title?: ReactNode;
  variant?: "rule";
  children?: ReactNode;
}) {
  const classes = ["notice", `notice-${tone}`, variant === "rule" ? "notice-rule" : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role={role ?? (tone === "error" ? "alert" : undefined)}>
      {title ? <p className="notice-title">{title}</p> : null}
      {children}
    </div>
  );
}
