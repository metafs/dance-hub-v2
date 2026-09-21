export type SegmentOption = { value: string; label: string };

/**
 * A single choice shown as joined segments. It is a plain radio group, so it
 * works inside a GET form without client-side JavaScript.
 */
export function Segmented({
  name,
  legend,
  options,
  value,
}: {
  name: string;
  legend: string;
  options: readonly SegmentOption[];
  value: string;
}) {
  return (
    <fieldset className="field">
      <legend className="filter-legend">{legend}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label key={option.value || "all"}>
            <input defaultChecked={option.value === value} name={name} type="radio" value={option.value} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
