import type { ReactNode } from "react";

/**
 * The top of a public page: a line of metadata, the one h1, an optional lede
 * and actions. Metadata is plain text or inline labels, never a second heading.
 */
export function PageHead({
  meta,
  title,
  lede,
  actions,
  children,
}: {
  meta?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      {meta ? <div className="page-meta">{meta}</div> : null}
      <h1 className="page-title">{title}</h1>
      {lede ? <p className="page-lede">{lede}</p> : null}
      {children}
      {actions ? <div className="page-head-actions">{actions}</div> : null}
    </header>
  );
}

/** The heading block of a workspace or admin page. */
export function AppPageHead({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="app-page-head">
      {breadcrumb ? <nav aria-label="現在地" className="app-breadcrumb">{breadcrumb}</nav> : null}
      <div className="page-head-split">
        <div className="app-page-title">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="page-head-actions">{actions}</div> : null}
      </div>
    </header>
  );
}
