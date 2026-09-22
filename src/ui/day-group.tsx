import type { ReactNode } from "react";

/** Groups rows under one date, set large in the left column. */
export function DayGroup({
  date,
  sub,
  children,
}: {
  date: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="day-group">
      <div className="day-group-label">
        <span className="day-group-date">{date}</span>
        {sub ? <span className="day-group-sub">{sub}</span> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function DayGroups({
  compact = false,
  children,
}: {
  compact?: boolean;
  children: ReactNode;
}) {
  return <div className={compact ? "day-groups day-groups-compact" : "day-groups"}>{children}</div>;
}
