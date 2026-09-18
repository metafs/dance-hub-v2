import { isEventType } from "@/features/revisions/schema";

import type { DiscoveryFilters, Prefecture } from "./projection";

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export const prefectures = ["TOKYO", "KANAGAWA"] as const;

const tokyoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function single(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first.trim() : "";
}

function isPrefecture(value: string): value is Prefecture {
  return prefectures.some((prefecture) => prefecture === value);
}

/**
 * Reads discovery filters out of the query string. A value that is not a
 * Tokyo calendar date, a known Prefecture, or a known Event Type is dropped
 * rather than rejected: a Visitor who edits or shares a URL should still get
 * the list, not an error page.
 */
export function parseDiscoveryFilters(params: SearchParamsInput): DiscoveryFilters {
  const from = single(params.from);
  const to = single(params.to);
  const prefecture = single(params.prefecture);
  const eventType = single(params.type);

  return {
    from: tokyoDatePattern.test(from) ? from : null,
    to: tokyoDatePattern.test(to) ? to : null,
    prefecture: isPrefecture(prefecture) ? prefecture : null,
    eventType: isEventType(eventType) ? eventType : null,
  };
}

/**
 * The canonical query string for a set of filters, so a filtered view can be
 * linked to and shared. Empty filters produce an empty string rather than a
 * bare "?".
 */
export function filterQueryString(filters: DiscoveryFilters): string {
  const params = new URLSearchParams();

  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.prefecture) params.set("prefecture", filters.prefecture);
  if (filters.eventType) params.set("type", filters.eventType);

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function hasActiveFilter(filters: DiscoveryFilters): boolean {
  return Boolean(
    filters.from || filters.to || filters.prefecture || filters.eventType,
  );
}
