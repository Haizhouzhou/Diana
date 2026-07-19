import { NumericField } from "./NumericField";
export function SliderNumberField(props: Parameters<typeof NumericField>[0]) {
  return <div className="slider-number"><NumericField {...props} /><input aria-label={`${props.label} slider`} type="range" value={props.value} min={props.min} max={props.max} step={props.step} disabled={props.disabled} onChange={(event) => props.onChange(event.currentTarget.valueAsNumber)} /></div>;
}
