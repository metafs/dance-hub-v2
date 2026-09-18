import Link from "next/link";

import DiscoveryEventList from "./discovery-event-list";
import { listPublicEvents } from "../queries";

export default async function Home() {
  const events = await listPublicEvents();
  const upcoming = events.filter((event) => event.state === "published").slice(0, 6);

  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="メインナビゲーション">
        <span className="wordmark">DANCE HUB</span>
        <div className="button-row">
          <Link className="button button-quiet" href="/events">Event</Link>
          <Link className="button button-quiet" href="/calendar">Calendar</Link>
          <Link className="button button-quiet" href="/open-calls">募集中</Link>
          <Link className="button button-quiet" href="/login">Organizer login</Link>
        </div>
      </nav>
      <section className="landing-hero">
        <p className="eyebrow">Dance information, held with care.</p>
        <h1>踊りの現在を、<br />未来の記録へ。</h1>
        <p className="landing-copy">
          DANCE HUBは、東京・神奈川のEvent、Artist、Venue、Organizationを
          つなぎ、公開とアーカイブを支える情報基盤です。
        </p>
        <div className="button-row">
          <Link className="button button-primary" href="/events">Eventを探す</Link>
          <Link className="button button-secondary" href="/calendar">Calendarで見る</Link>
        </div>
      </section>
      <section className="landing-discovery">
        <div className="section-heading">
          <h2>近日開催</h2>
          <Link className="text-link" href="/events">すべてのEvent →</Link>
        </div>
        <DiscoveryEventList
          emptyMessage="公開中のEventはまだありません。"
          events={upcoming}
        />
      </section>
    </main>
  );
}
