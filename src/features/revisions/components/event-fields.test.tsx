import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EventFields } from "./event-fields";

// A message rendered inside a <label> joins that control's accessible name.
// The image pairing rejection names 代替テキスト but belongs to the file input,
// so nesting it would make two controls answer to 代替テキスト and break any
// lookup by label.
describe("EventFields error placement", () => {
  it("keeps a message naming another field out of its own control's label", () => {
    const html = renderToStaticMarkup(
      <EventFields
        artists={[]}
        venues={[]}
        festivalParents={[]}
        errors={{ image: ["代替テキストを保存するには画像ファイルを選択してください。"] }}
      />,
    );
    const labels = html.match(/<label[^>]*>[\s\S]*?<\/label>/g) ?? [];
    const withAlt = labels.filter((l) => l.includes("代替テキスト"));
    expect(withAlt).toHaveLength(1);
    expect(withAlt[0]).toContain('name="imageAlt"');
    expect(html).toContain("field-error");
  });

  it("renders no error markup when there are none", () => {
    const html = renderToStaticMarkup(
      <EventFields artists={[]} venues={[]} festivalParents={[]} />,
    );

    expect(html).not.toContain("field-error");
  });
});
