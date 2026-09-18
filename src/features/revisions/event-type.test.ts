import { describe, expect, it } from "vitest";

import {
  eventTypeGroup,
  eventTypeLabel,
  eventTypeOptions,
  eventTypes,
  isApplyEventType,
} from "./schema";

describe("Event Type taxonomy", () => {
  it("maps every value to the group REQ-EVENT-004 assigns it", () => {
    expect(eventTypes.map((eventType) => [eventType, eventTypeGroup(eventType)])).toEqual([
      ["performance", "watch"],
      ["open_studio", "watch"],
      ["talk", "watch"],
      ["workshop", "participate"],
      ["audition", "apply"],
      ["open_call", "apply"],
      ["residency", "apply"],
      ["festival", "container"],
      ["other", "other"],
    ]);
  });

  it("maps every value to the label REQ-EVENT-004 assigns it", () => {
    expect(eventTypes.map(eventTypeLabel)).toEqual([
      "公演",
      "オープンスタジオ",
      "トーク",
      "ワークショップ",
      "オーディション",
      "公募",
      "レジデンス",
      "フェスティバル",
      "その他",
    ]);
  });

  it("treats audition, open_call, and residency as the apply group", () => {
    expect(eventTypes.filter(isApplyEventType)).toEqual([
      "audition",
      "open_call",
      "residency",
    ]);
  });

  it("exposes one option per Event Type in enum order", () => {
    expect(eventTypeOptions.map((option) => option.value)).toEqual([...eventTypes]);
    expect(eventTypeOptions.every((option) => option.label.length > 0)).toBe(true);
  });

  it("never falls back to the raw enum value as a label", () => {
    for (const eventType of eventTypes) {
      expect(eventTypeLabel(eventType)).not.toBe(eventType);
    }
  });
});
