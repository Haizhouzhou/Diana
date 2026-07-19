interface Option<T extends string> { value: T; label: string }
export function SegmentedControl<T extends string>({ label, value, options, onChange, disabled = false }: { label: string; value: T; options: ReadonlyArray<Option<T>>; onChange: (value: T) => void; disabled?: boolean }) {
  return <fieldset className="segmented" disabled={disabled}><legend>{label}</legend><div role="radiogroup" aria-label={label}>{options.map((option) => <label key={option.value} className={value === option.value ? "selected" : ""}><input type="radio" checked={value === option.value} onChange={() => onChange(option.value)} />{option.label}</label>)}</div></fieldset>;
}
