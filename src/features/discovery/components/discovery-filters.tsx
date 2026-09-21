import Link from "next/link";

import { eventTypeOptions, type EventTypeGroup } from "@/features/revisions/schema";
import { Segmented } from "@/ui/segmented";

import { hasActiveFilter, prefectures } from "../filters";
import { prefectureLabel, type DiscoveryFilters } from "../projection";

const groupNames: Record<EventTypeGroup, string> = {
  watch: "観る",
  participate: "参加する",
  apply: "応募する",
  container: "そのほか",
  other: "そのほか",
};

const typeGroups = eventTypeOptions.reduce<{ name: string; options: typeof eventTypeOptions }[]>(
  (groups, option) => {
    const name = groupNames[option.group];
    const group = groups.find((item) => item.name === name);
    if (group) group.options.push(option);
    else groups.push({ name, options: [option] });
    return groups;
  },
  [],
);

/**
 * The 探す filters. A plain GET form keeps every filter in the URL, so a
 * filtered view can be shared and works without client-side JavaScript.
 */
export function DiscoveryFilterForm({ filters }: { filters: DiscoveryFilters }) {
  return (
    <form action="/events" aria-label="絞り込み" className="discovery-filters" method="get">
      <div className="field">
        <label className="filter-label" htmlFor="filter-q">キーワード</label>
        {/*
          One box over Event 名, Artist 名, Venue 名 and Organization 名
          (REQ-DISCOVERY-003); matching happens on the loaded projection
          (ADR-0020), so there is nothing to configure per field here.
        */}
        <input
          defaultValue={filters.text ?? ""}
          id="filter-q"
          maxLength={200}
          name="q"
          placeholder="作品名、出演者、会場、主催"
          type="search"
        />
      </div>

      <fieldset className="field">
        <legend className="filter-legend">期間（開催日）</legend>
        <div className="date-range">
          <label className="visually-hidden" htmlFor="filter-from">開始日</label>
          <input defaultValue={filters.from ?? ""} id="filter-from" name="from" type="date" />
          <label className="visually-hidden" htmlFor="filter-to">終了日</label>
          <input defaultValue={filters.to ?? ""} id="filter-to" name="to" type="date" />
        </div>
      </fieldset>

      <Segmented
        legend="地域"
        name="prefecture"
        options={[
          { value: "", label: "すべて" },
          ...prefectures.map((prefecture) => ({ value: prefecture, label: prefectureLabel(prefecture) })),
        ]}
        value={filters.prefecture ?? ""}
      />

      <fieldset className="field">
        <legend className="filter-legend">種別</legend>
        <label className="choice">
          <input defaultChecked={!filters.eventType} name="type" type="radio" value="" />
          すべて
        </label>
        {typeGroups.map((group) => (
          <div className="choice-group" key={group.name}>
            <span className="choice-group-label">{group.name}</span>
            {group.options.map((option) => (
              <label className="choice" key={option.value}>
                <input
                  defaultChecked={filters.eventType === option.value}
                  name="type"
                  type="radio"
                  value={option.value}
                />
                {option.label}
              </label>
            ))}
          </div>
        ))}
      </fieldset>

      <div className="form-stack">
        <button className="button button-primary" type="submit">絞り込む</button>
        {hasActiveFilter(filters) ? (
          <Link className="text-link" href="/events">条件をクリア</Link>
        ) : null}
      </div>
    </form>
  );
}
