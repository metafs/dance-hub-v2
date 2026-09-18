import Link from "next/link";

import { formatTokyoDateTime } from "@/lib/datetime";

import { prefectureLabel } from "../projection";
import { listOpenApplications } from "../queries";

export default async function OpenCallPage() {
  const events = await listOpenApplications();

  return (
    <main className="workspace-main">
      <Link className="back-link" href="/">← DANCE HUB</Link>
      <div className="section-heading">
        <h1>募集中</h1>
        <p className="queue-count">{events.length}件</p>
      </div>
      <p className="lede">
        オーディション、公募、レジデンスを応募締切の近い順に並べています。
        開催日が未定のものも含みます。
      </p>

      {events.length === 0 ? (
        <p className="empty-state">応募を受け付けているEventは現在ありません。</p>
      ) : (
        <ul className="discovery-list">
          {events.map((event) => {
            const [first] = event.schedules;

            return (
              <li className="discovery-card" key={event.id}>
                <p className="eyebrow">{event.typeLabel}</p>
                <h3>
                  <Link href={`/events/${event.id}`}>{event.title}</Link>
                </h3>
                <dl className="discovery-meta">
                  <div>
                    <dt>応募締切</dt>
                    <dd>
                      {formatTokyoDateTime(event.applicationDeadline as string)}（東京時間）
                    </dd>
                  </div>
                  {first ? (
                    <div>
                      <dt>開催</dt>
                      <dd>
                        {formatTokyoDateTime(first.startsAt)} / {first.venueName}
                        （{prefectureLabel(first.prefecture)}）
                      </dd>
                    </div>
                  ) : (
                    <div>
                      <dt>開催</dt>
                      <dd>未定</dd>
                    </div>
                  )}
                  {event.organizationName ? (
                    <div>
                      <dt>主催</dt>
                      <dd>{event.organizationName}</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
