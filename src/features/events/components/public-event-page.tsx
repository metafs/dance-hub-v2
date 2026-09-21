import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPublicEventSummary,
  listFestivalChildEvents,
} from "@/features/discovery/queries";
import { EventRow, PublicationStateLabel, scheduleTime } from "@/features/discovery/components/event-row";
import { listingSchedule } from "@/features/discovery/listing";
import { getPublicEventPageData } from "@/features/events/queries";
import { eventPublicationState } from "@/features/events/publication-state";
import {
  accessLinkKindLabel,
  eventTypeLabel,
  ticketOfferPrice,
  type TicketOfferInput,
  type TicketPriceType,
} from "@/features/revisions/schema";
import { prefectureName } from "@/features/shared-entities/schema";
import {
  dayLabel,
  formatTokyoDate,
  formatTokyoDateTime,
  formatTokyoTime,
  tokyoDateKey,
} from "@/lib/datetime";
import { DefinitionRows } from "@/ui/definition-rows";
import { RowList } from "@/ui/list-row";
import { Notice } from "@/ui/notice";
import { PageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";

type VenueValue = {
  id: string;
  name: string;
  prefecture: string;
  address_line1: string | null;
  address_line2: string | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** `9.25 金`, with the year when it is not the current one. */
function shortDay(instant: string, currentYear: string) {
  const day = tokyoDateKey(instant);
  const label = day ? dayLabel(day) : null;
  if (!day || !label) return "";
  const prefix = day.slice(0, 4) === currentYear ? "" : `${label.year}.`;
  return `${prefix}${label.monthDay} ${label.weekday.slice(0, 1)}`;
}

function timeRange(schedule: { starts_at: string; ends_at: string | null; all_day: boolean }) {
  if (schedule.all_day) return "終日";
  const start = formatTokyoTime(schedule.starts_at);
  return schedule.ends_at ? `${start} – ${formatTokyoTime(schedule.ends_at)}` : start;
}

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
    organization,
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
  const datedSchedules = revision.event_type === "festival" ? childSchedules : schedules ?? [];

  const state = eventPublicationState({
    eventType: revision.event_type,
    cancelledAt: event.cancelled_at,
    applicationDeadline: revision.application_deadline,
    schedules: datedSchedules,
  });

  const now = new Date();
  const currentYear = tokyoDateKey(now.toISOString())?.slice(0, 4) ?? "";
  const sortedStarts = datedSchedules.map((schedule) => schedule.starts_at).sort();
  const firstDay = sortedStarts[0] ? shortDay(sortedStarts[0], currentYear) : null;
  const lastDay = sortedStarts.length > 1 ? shortDay(sortedStarts[sortedStarts.length - 1], currentYear) : null;

  const venues = [...new Map(
    (schedules ?? [])
      .map((schedule) => one(schedule.venues as VenueValue | VenueValue[] | null))
      .filter((venue): venue is VenueValue => Boolean(venue))
      .map((venue) => [venue.id, venue]),
  ).values()];

  const creditRows = (credits ?? []).map((credit) => {
    const artist = one(credit.artists as { id: string; name: string } | { id: string; name: string }[] | null);
    return { role: credit.role, order: credit.display_order, artist };
  });

  return (
    <div className="container">
      <PageHead
        meta={
          <>
            {revision.event_type ? <span>{eventTypeLabel(revision.event_type)}</span> : null}
            <PublicationStateLabel state={state} />
            {revision.event_type !== "festival" && datedSchedules.length > 1
              ? <span className="tabular">{datedSchedules.length}回</span>
              : null}
            {firstDay ? <span className="tabular">{lastDay && lastDay !== firstDay ? `${firstDay} – ${lastDay}` : firstDay}</span> : null}
          </>
        }
        title={revision.title}
      >
        {creditRows.length ? (
          <p className="credit-line">
            {creditRows.slice(0, 4).map((credit, index) => (
              <span key={`${credit.order}-${credit.role}`}>
                {index > 0 ? "　／　" : null}
                {credit.role}　
                {credit.artist ? <Link href={`/artists/${credit.artist.id}`}>{credit.artist.name}</Link> : null}
              </span>
            ))}
          </p>
        ) : null}
      </PageHead>

      {event.cancelled_at ? (
        <Notice role="status" title="このEventは中止になりました。" tone="plain" variant="rule">
          {event.cancellation_reason ? <p>{event.cancellation_reason}</p> : null}
          <p className="section-note tabular">{formatTokyoDate(event.cancelled_at)} に中止が決まりました</p>
        </Notice>
      ) : null}

      <div className="detail-layout">
        <div className="detail-main">
          {media ? (
            <>
              {/* The image is streamed by a route that resolves the approved
                  Revision, and its dimensions are deliberately not measured
                  (ADR-0016), so next/image does not apply. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={media.alt_text} className="event-image" src={`/events/${eventId}/image`} />
            </>
          ) : null}
          {revision.description ? <div className="prose">{revision.description}</div> : null}

          {parent ? (
            <Section id="event-festival" size="small" title="フェスティバル">
              <p>
                このEventは
                <Link className="text-link" href={`/events/${parent.id}`}>{parent.title}</Link>
                のプログラムです。
              </p>
            </Section>
          ) : null}

          {children.length ? (
            <Section id="event-programme" size="small" title="プログラム">
              <RowList bordered variant="lead-wide">
                {children.map((child) => {
                  const schedule = listingSchedule(child, now);
                  return (
                    <EventRow
                      event={child}
                      key={child.id}
                      lead={schedule ? (
                        <>
                          {shortDay(schedule.startsAt, currentYear)}
                          <br />
                          <span className="muted">{scheduleTime(schedule)}</span>
                        </>
                      ) : "—"}
                      schedule={schedule}
                    />
                  );
                })}
              </RowList>
            </Section>
          ) : null}

          {schedules?.length ? (
            <Section
              aside={<span className="section-note">日本時間</span>}
              id="event-schedules"
              size="small"
              title="日程と会場"
            >
              <table className="table table-plain">
                <tbody>
                  {schedules.map((schedule, index) => {
                    const venue = one(schedule.venues as VenueValue | VenueValue[] | null);
                    return (
                      <tr key={`${schedule.starts_at}-${index}`}>
                        <td className="tabular">{shortDay(schedule.starts_at, currentYear)}</td>
                        <td className="tabular">{timeRange(schedule)}</td>
                        <td>{venue ? <Link className="text-link" href={`/venues/${venue.id}`}>{venue.name}</Link> : "会場"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Section>
          ) : null}

          {creditRows.length ? (
            <Section id="event-credits" size="small" title="出演・スタッフ">
              <DefinitionRows
                rows={creditRows.map((credit) => ({
                  key: `${credit.order}-${credit.role}`,
                  term: credit.role,
                  detail: credit.artist
                    ? <Link href={`/artists/${credit.artist.id}`}>{credit.artist.name}</Link>
                    : null,
                }))}
              />
            </Section>
          ) : null}

          {ticketOffers?.length || revision.no_registration_required || revision.application_deadline || accessLinks?.length ? (
          <Section id="event-access" size="small" title="参加方法">
            {ticketOffers?.length ? (
              <table className="table table-plain">
                <tbody>
                  {ticketOffers.map((offer) => {
                    const typedOffer: Omit<TicketOfferInput, "display_order"> = {
                      ...offer,
                      price_type: offer.price_type as TicketPriceType,
                      amount_minor: offer.amount_minor == null ? null : String(offer.amount_minor),
                      min_amount_minor: offer.min_amount_minor == null ? null : String(offer.min_amount_minor),
                      max_amount_minor: offer.max_amount_minor == null ? null : String(offer.max_amount_minor),
                    };
                    const price = ticketOfferPrice(typedOffer);
                    return (
                      <tr key={offer.display_order}>
                        <td>{offer.label || price}</td>
                        <td className="offer-price">{offer.label ? price : null}</td>
                        <td className="offer-note">{offer.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : null}
            {revision.no_registration_required ? <p>申込は不要です。当日そのまま参加できます。</p> : null}
            {revision.application_deadline ? (
              <p className="tabular">応募締切　{formatTokyoDateTime(revision.application_deadline)}（日本時間）</p>
            ) : null}
            {accessLinks?.length ? (
              <div className="button-row">
                {accessLinks.map((item, index) => (
                  <a
                    className={index === 0 ? "button button-primary" : "button"}
                    href={item.url}
                    key={`${item.kind}-${item.display_order}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.label || accessLinkKindLabel(item.kind)}
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
                <span className="section-note">外部のサイトに移動します</span>
              </div>
            ) : null}
          </Section>
          ) : null}
        </div>

        <aside aria-label="会場と主催" className="detail-aside">
          {venues.map((venue) => (
            <div className="venue-card" key={venue.id}>
              <span className="detail-aside-label">会場</span>
              <Link className="venue-card-name" href={`/venues/${venue.id}`}>{venue.name}</Link>
              <span>
                {prefectureName(venue.prefecture)} {venue.address_line1}
                {venue.address_line2 ? ` ${venue.address_line2}` : ""}
              </span>
              <Link className="text-link" href={`/venues/${venue.id}`}>この会場の上演を見る</Link>
            </div>
          ))}
          {organization?.name ? (
            <div className="detail-aside-block">
              <span className="detail-aside-label">主催</span>
              <span>{organization.name}</span>
            </div>
          ) : null}
          {revision.contact_value ? (
            <div className="detail-aside-block">
              <span className="detail-aside-label">問い合わせ</span>
              {revision.contact_kind === "email" ? (
                <a href={`mailto:${revision.contact_value}`}>{revision.contact_value}</a>
              ) : (
                <a href={revision.contact_value} rel="noreferrer" target="_blank">
                  {revision.contact_kind === "social" ? "SNSで問い合わせる" : "公式サイトで問い合わせる"}
                </a>
              )}
            </div>
          ) : null}
          {links?.length ? (
            <div className="detail-aside-block">
              <span className="detail-aside-label">関連リンク</span>
              {links.map((item) => (
                <a href={item.url} key={item.display_order} rel="noreferrer" target="_blank">
                  {item.label}
                </a>
              ))}
            </div>
          ) : null}
          {/* Listing policy G-6: a proxy listing names who entered it and where
              to correct it; every listing offers the withdrawal route (F). */}
          <div className="detail-aside-block detail-aside-note">
            {event.listing_origin === "proxy" ? (
              <>
                <span>この情報は、公開されている告知をもとに p8ce 運営が掲載しました。</span>
                <Link href={`/listing-requests?event=${eventId}&kind=correction`}>内容の修正を依頼する</Link>
              </>
            ) : null}
            <span>主催者・権利者・出演者の方は、掲載の削除や修正を依頼できます。</span>
            <Link href={`/listing-requests?event=${eventId}&kind=withdrawal`}>掲載の削除・修正を依頼する</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
