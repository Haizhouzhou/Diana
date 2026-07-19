import { NumericField } from "../controls/NumericField";
import { SliderNumberField } from "../controls/SliderNumberField";
import { SegmentedControl } from "../controls/SegmentedControl";
import { SPLITTER_CATALOG } from "../catalog/splitters";
import { useStudio } from "../workspace/studio-context";

export function SplitEditor() {
  const { spec, updateSpec } = useStudio(); const locked = spec.mode === "hormonbench_preset";
  return <section className="editor-section" aria-labelledby="split-title"><header><p className="eyebrow">03 / Evaluation split</p><h1 id="split-title">Separate what must remain independent</h1><p>The generated program asserts zero group overlap or strict target-time ordering before any model fit.</p></header>
    <SegmentedControl label="Split strategy" value={spec.split.type} disabled={locked} options={SPLITTER_CATALOG} onChange={(value) => updateSpec((draft) => { draft.split.type = value; })} />
    <SliderNumberField id="validation-fraction" label="Validation fraction" value={spec.split.validation_fraction} min={0.05} max={0.35} step={0.05} disabled={locked} onChange={(value) => updateSpec((draft) => { draft.split.validation_fraction = value; })} />
    <SliderNumberField id="test-fraction" label="Test fraction" value={spec.split.test_fraction} min={0.05} max={0.35} step={0.05} disabled={locked} onChange={(value) => updateSpec((draft) => { draft.split.test_fraction = value; })} />
    <NumericField id="split-seed" label="Deterministic split seed" value={spec.split.seed} min={0} max={2_147_483_647} disabled={locked} onChange={(value) => updateSpec((draft) => { draft.split.seed = value; })} />
    <div className="ratio-bar" aria-label="Train validation test proportions"><span style={{ flex: 1 - spec.split.validation_fraction - spec.split.test_fraction }}>Train {(100 * (1 - spec.split.validation_fraction - spec.split.test_fraction)).toFixed(0)}%</span><span style={{ flex: spec.split.validation_fraction }}>Val {(100 * spec.split.validation_fraction).toFixed(0)}%</span><span style={{ flex: spec.split.test_fraction }}>Test {(100 * spec.split.test_fraction).toFixed(0)}%</span></div>
  </section>;
}
