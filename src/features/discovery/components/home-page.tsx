import Image from "next/image";
import Link from "next/link";

import { RowList } from "@/ui/list-row";
import { Section } from "@/ui/section";

import { openApplications } from "../projection";
import { listPublicEvents } from "../queries";
import { EventListing } from "./event-listing";
import { EventRow, monthDay } from "./event-row";

const typeLinks = [
  {
    group: "観る",
    links: [
      { href: "/events?type=performance", label: "公演" },
      { href: "/events?type=open_studio", label: "オープンスタジオ" },
      { href: "/events?type=talk", label: "トーク" },
    ],
  },
  { group: "参加する", links: [{ href: "/events?type=workshop", label: "ワークショップ" }] },
  { group: "応募する", links: [{ href: "/open-calls", label: "オーディション・公募・レジデンス" }] },
];

export default async function Home() {
  const events = await listPublicEvents();
  const calls = openApplications(events).slice(0, 3);

  return (
    <div className="container">
      <section aria-labelledby="home-title" className="home-hero">
        <Image
          alt="p8ce"
          className="home-hero-logo"
          height={240}
          priority
          src="/brand/p8ce-logo.svg"
          width={240}
        />
        <div className="home-hero-body">
          <div>
            <h1 id="home-title">関東・関西のダンスとパフォーマンスを探す</h1>
            <p className="home-tagline">どの上演にも、それぞれのペースがある。</p>
          </div>
          <form action="/events" className="home-search" method="get" role="search">
            <label className="visually-hidden" htmlFor="home-q">キーワード</label>
            <input
              id="home-q"
              maxLength={200}
              name="q"
              placeholder="作品名、出演者、会場、主催"
              type="search"
            />
            <button className="button button-primary" type="submit">探す</button>
          </form>
          <nav aria-label="種別から探す" className="home-types">
            {typeLinks.map((group) => (
              <span className="home-types-set" key={group.group}>
                <span className="home-types-group">{group.group}</span>
                {group.links.map((link) => (
                  <Link href={link.href} key={link.href}>{link.label}</Link>
                ))}
              </span>
            ))}
          </nav>
        </div>
      </section>

      <Section
        aside={<Link className="text-link" href="/events">すべて見る</Link>}
        id="home-upcoming"
        title="これからの上演"
      >
        <EventListing
          emptyMessage="公開中のEventはまだありません。"
          events={events}
          limit={8}
          showArchive={false}
        />
      </Section>

      {calls.length ? (
        <Section
          aside={<Link className="text-link" href="/open-calls">すべて見る</Link>}
          id="home-open-calls"
          title="募集中"
        >
          <p className="section-note">締切の近い順</p>
          <RowList bordered variant="lead-wide">
            {calls.map((event) => (
              <EventRow
                event={event}
                key={event.id}
                lead={`締切 ${monthDay(event.applicationDeadline)}`}
                schedule={event.schedules[0] ?? null}
              />
            ))}
          </RowList>
        </Section>
      ) : null}
    </div>
  );
}
