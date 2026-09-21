/**
 * The p8ce logotype set in type. Below 40px the curve is dropped and the
 * logotype stands alone (docs/brand/identity.md, サイズ), which is every size
 * the interface uses; the full mark is the canonical SVG in /public.
 */
export function Logotype({ reading }: { reading?: string }) {
  return (
    <span className="logotype">
      <span className="logotype-mark">p8ce</span>
      {reading ? <span className="logotype-reading">{reading}</span> : null}
    </span>
  );
}
