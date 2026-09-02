import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ticketOfferPrice, type TicketOfferInput, type TicketPriceType } from "@/lib/events/ticket-offers";

function japaneseDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, published_revision_id, cancelled_at, cancellation_reason")
    .eq("id", eventId)
    .maybeSingle();

  if (!event?.published_revision_id) notFound();

  const [{ data: revision }, { data: schedules }, { data: credits }, { data: ticketOffers }, { data: accessLinks }, { data: links }, { data: media }] = await Promise.all([
    supabase.from("event_revisions").select("title, description, event_type, application_deadline, no_registration_required").eq("id", event.published_revision_id).maybeSingle(),
    supabase.from("event_schedules").select("starts_at, ends_at, all_day, venues(name, prefecture)").eq("event_revision_id", event.published_revision_id).order("starts_at"),
    supabase.from("event_artists").select("role, display_order, artists(name)").eq("event_revision_id", event.published_revision_id).order("display_order"),
    supabase.from("event_ticket_offers").select("price_type, label, currency, amount_minor, min_amount_minor, max_amount_minor, notes, display_order").eq("event_revision_id", event.published_revision_id).order("display_order"),
    supabase.from("event_ticket_links").select("kind, label, url, display_order").eq("event_revision_id", event.published_revision_id).order("display_order"),
    supabase.from("event_links").select("label, url, display_order").eq("event_revision_id", event.published_revision_id).order("display_order"),
    supabase.from("event_media").select("object_key, alt_text").eq("event_revision_id", event.published_revision_id).eq("is_main", true).maybeSingle(),
  ]);

  if (!revision) notFound();

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
          <p className="eyebrow">{revision.event_type}</p>
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
      <section className="section-block">
        <h2>日時・会場</h2>
        <div className="details-list">
          {schedules?.map((schedule, index) => {
            const venue = Array.isArray(schedule.venues) ? schedule.venues[0] : schedule.venues;
            return <div key={`${schedule.starts_at}-${index}`}><dt>{venue?.name ?? "会場"}</dt><dd>{schedule.all_day ? japaneseDate(schedule.starts_at).slice(0, 11) : `${japaneseDate(schedule.starts_at)}${schedule.ends_at ? ` — ${japaneseDate(schedule.ends_at)}` : ""}`}（東京時間）</dd></div>;
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
        {revision.application_deadline ? <p>申込締切: {japaneseDate(revision.application_deadline)}（東京時間）</p> : null}
      </section>
      {links?.length ? <section className="section-block"><h2>関連リンク</h2><div className="button-row">{links.map((item) => <a className="button button-quiet" href={item.url} key={item.display_order} rel="noreferrer" target="_blank">{item.label}</a>)}</div></section> : null}
    </main>
  );
}
