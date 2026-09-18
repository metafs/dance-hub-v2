import Link from "next/link";
import { notFound } from "next/navigation";

import { formatTokyoDateTime } from "@/lib/datetime";
import {
  eventTypeLabel,
  ticketOfferPrice,
  type TicketOfferInput,
  type TicketPriceType,
} from "@/features/revisions/schema";
import { getPublicEventPageData } from "@/features/events/queries";
import {
  eventPublicationState,
  eventPublicationStateLabel,
} from "@/features/events/publication-state";
import {
  getPublicEventSummary,
  listFestivalChildEvents,
} from "@/features/discovery/queries";
import { prefectureLabel } from "@/features/discovery/projection";

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const { data, event } = await getPublicEventPageData(eventId);

  if (!event?.published_revision_id || !data?.revision) notFound();

  const {
    accessLinks,
    credits,
    links,
    media,
    revision,
    schedules,
    ticketOffers,
  } = data;

  // A Festival carries no Schedules of its own; its dates and its past
  // determination come from its published child Events (ADR-0009).
  const children = revision.event_type === "festival"
    ? await listFestivalChildEvents(eventId)
    : [];
  const parent = event.parent_event_id
    ? await getPublicEventSummary(event.parent_event_id)
    : null;

  const childSchedules = children.flatMap((child) =>
    child.schedules.map((schedule) => ({
      starts_at: schedule.startsAt,
      ends_at: schedule.endsAt,
      all_day: schedule.allDay,
    })));

  const state = eventPublicationState({
    eventType: revision.event_type,
    cancelledAt: event.cancelled_at,
    applicationDeadline: revision.application_deadline,
    schedules: revision.event_type === "festival"
      ? childSchedules
      : schedules ?? [],
  });

  return (
    <main className="workspace-main narrow-main public-event">
      <Link className="back-link" href="/">← DANCE HUB</Link>
      {event.cancelled_at ? (
        <p className="notice notice-error" role="status">
          このEventは中止になりました。{event.cancellation_reason}
        </p>
      ) : null}
      <section className="hero-card">
        <div>
          <p className="eyebrow">
            {revision.event_type ? eventTypeLabel(revision.event_type) : null}
            {state === "published" ? null : (
              <span className="state-badge" data-state={state}>
                {eventPublicationStateLabel(state)}
              </span>
            )}
          </p>
          <h1>{revision.title}</h1>
          <p className="lede">{revision.description}</p>
        </div>
      </section>
      {media ? (
        <section className="section-block" aria-label="メイン画像">
          <div className="image-placeholder" role="img" aria-label={media.alt_text}>
            <span>MAIN IMAGE</span>
            <strong>{media.alt_text}</strong>
          </div>
        </section>
      ) : null}
      {parent ? (
        <section className="section-block">
          <h2>フェスティバル</h2>
          <p>
            このEventは
            <Link className="text-link" href={`/events/${parent.id}`}>
              {parent.title}
            </Link>
            のプログラムです。
          </p>
        </section>
      ) : null}
      {children.length ? (
        <section className="section-block">
          <h2>プログラム</h2>
          <ul className="public-event-list">
            {children.map((child) => {
              const first = child.schedules[0];
              return (
                <li key={child.id}>
                  <Link className="text-link" href={`/events/${child.id}`}>
                    {child.title}
                  </Link>
                  <p className="event-list-meta">
                    {child.typeLabel ? <span>{child.typeLabel}</span> : null}
                    {first ? (
                      <span>
                        {formatTokyoDateTime(first.startsAt)}（東京時間）
                        {" / "}
                        {first.venueName}（{prefectureLabel(first.prefecture)}）
                      </span>
                    ) : null}
                    {child.state === "published" ? null : (
                      <span className="state-badge" data-state={child.state}>
                        {eventPublicationStateLabel(child.state)}
                      </span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <section className="section-block">
        <h2>日時・会場</h2>
        <div className="details-list">
          {schedules?.map((schedule, index) => {
            const venue = Array.isArray(schedule.venues) ? schedule.venues[0] : schedule.venues;
            return <div key={`${schedule.starts_at}-${index}`}><dt>{venue?.name ?? "会場"}</dt><dd>{schedule.all_day ? formatTokyoDateTime(schedule.starts_at).slice(0, 11) : `${formatTokyoDateTime(schedule.starts_at)}${schedule.ends_at ? ` — ${formatTokyoDateTime(schedule.ends_at)}` : ""}`}（東京時間）</dd></div>;
          })}
        </div>
      </section>
      <section className="section-block">
        <h2>Artist</h2>
        <div className="details-list">{credits?.map((credit) => {
          const artist = Array.isArray(credit.artists) ? credit.artists[0] : credit.artists;
          return <div key={`${credit.display_order}-${credit.role}`}><dt>{credit.role}</dt><dd>{artist?.name}</dd></div>;
        })}</div>
      </section>
      <section className="section-block">
        <h2>参加方法</h2>
        {ticketOffers?.length ? <div className="ticket-offer-list">{ticketOffers.map((offer) => {
          const typedOffer: Omit<TicketOfferInput, "display_order"> = { ...offer, price_type: offer.price_type as TicketPriceType, amount_minor: offer.amount_minor == null ? null : String(offer.amount_minor), min_amount_minor: offer.min_amount_minor == null ? null : String(offer.min_amount_minor), max_amount_minor: offer.max_amount_minor == null ? null : String(offer.max_amount_minor) };
          return <article className="ticket-offer-public" key={offer.display_order}><strong>{offer.label || ticketOfferPrice(typedOffer)}</strong>{offer.label ? <span>{ticketOfferPrice(typedOffer)}</span> : null}{offer.notes ? <p>{offer.notes}</p> : null}</article>;
        })}</div> : null}
        {revision.no_registration_required ? <p>申込不要</p> : null}
        <div className="button-row">{accessLinks?.map((item) => <a className="button button-secondary" href={item.url} key={`${item.kind}-${item.display_order}`} rel="noreferrer" target="_blank">{item.label || (item.kind === "ticket" ? "チケット" : "申込")}</a>)}</div>
        {revision.application_deadline ? <p>申込締切: {formatTokyoDateTime(revision.application_deadline)}（東京時間）</p> : null}
      </section>
      {links?.length ? <section className="section-block"><h2>関連リンク</h2><div className="button-row">{links.map((item) => <a className="button button-quiet" href={item.url} key={item.display_order} rel="noreferrer" target="_blank">{item.label}</a>)}</div></section> : null}
    </main>
  );
}
