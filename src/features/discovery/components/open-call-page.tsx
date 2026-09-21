import { EmptyState } from "@/ui/empty-state";
import { RowList } from "@/ui/list-row";
import { PageHead } from "@/ui/page-head";

import { listOpenApplications } from "../queries";
import { EventRow, monthDay } from "./event-row";

export default async function OpenCallPage() {
  const events = await listOpenApplications();

  return (
    <div className="container">
      <PageHead
        lede="オーディション、公募、レジデンスを応募締切の近い順に並べています。開催日が決まっていないものも含みます。"
        meta={<span className="tabular">{events.length}件</span>}
        title="募集中"
      />
      <p className="section-note">日時はすべて日本時間です。</p>

      {events.length === 0 ? (
        <EmptyState>応募を受け付けているEventは現在ありません。</EmptyState>
      ) : (
        <RowList bordered variant="lead-wide">
          {events.map((event) => {
            const [first] = event.schedules;
            return (
              <EventRow
                detail={[
                  event.organizationName ? `主催　${event.organizationName}` : null,
                  first ? `開催　${monthDay(first.startsAt)}` : null,
                ].filter(Boolean).join(" · ") || null}
                event={event}
                key={event.id}
                lead={`締切 ${monthDay(event.applicationDeadline)}`}
                schedule={first ?? null}
                {...(first
                  ? {}
                  : { aside: <span className="row-aside-sub">開催日未定</span> })}
              />
            );
          })}
        </RowList>
      )}
    </div>
  );
}
