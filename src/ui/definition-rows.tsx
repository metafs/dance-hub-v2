import { Fragment, type ReactNode } from "react";

export type DefinitionRow = { key: string; term: ReactNode; detail: ReactNode };

export function DefinitionRows({ rows }: { rows: readonly DefinitionRow[] }) {
  return (
    <dl className="dl-rows">
      {rows.map((row) => (
        <Fragment key={row.key}>
          <dt>{row.term}</dt>
          <dd>{row.detail}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
