/**
 * JSON for an inline `application/ld+json` script. `<`, `>` and `&` only occur
 * inside JSON strings, so escaping them keeps the value identical while no
 * user-supplied text (a title containing `</script>`, say) can close the
 * element and inject markup. U+2028/U+2029 are escaped for older parsers.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/[\u2028\u2029]/g, (character) => `\\u${character.charCodeAt(0).toString(16)}`);
}

/** Structured data for search engines. Renders nothing when there is none. */
export function JsonLd({ data }: { data: unknown }) {
  if (data == null || (Array.isArray(data) && data.length === 0)) return null;
  const value = Array.isArray(data) && data.length === 1 ? data[0] : data;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }}
      type="application/ld+json"
    />
  );
}
