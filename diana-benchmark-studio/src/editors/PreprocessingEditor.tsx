import { ColumnRoleEditor } from "../controls/ColumnRoleEditor";
import { SegmentedControl } from "../controls/SegmentedControl";
import { SCALER_CATALOG } from "../catalog/preprocessors";
import { useStudio } from "../workspace/studio-context";

export function PreprocessingEditor() {
  const { spec, updateSpec } = useStudio(); const locked = spec.mode === "hormonbench_preset";
  return <section className="editor-section" aria-labelledby="pre-title"><header><p className="eyebrow">04 / Preprocessing</p><h1 id="pre-title">Fit every transform on training rows</h1><p>Numeric and categorical pipelines are cloned per estimator. Validation and test distributions cannot change learned transforms.</p></header>
    <div className="contract-lines"><p><strong>Numeric missingness</strong><span>Median imputation · train only</span></p><p><strong>Categorical missingness</strong><span>Most-frequent imputation · train only</span></p><p><strong>Categorical encoding</strong><span>One-hot · unknown values ignored</span></p></div>
    <SegmentedControl label="Numeric scaling" value={spec.preprocessing.scaling} disabled={locked} options={SCALER_CATALOG} onChange={(value) => updateSpec((draft) => { draft.preprocessing.scaling = value; })} />
    <ColumnRoleEditor id="causal-lags" label="Causal lags" hint="Comma-separated positive observation steps" disabled={locked} values={spec.preprocessing.lags.map(String)} onChange={(values) => updateSpec((draft) => { draft.preprocessing.lags = values.map(Number).filter((value) => Number.isInteger(value) && value > 0); })} />
    <ColumnRoleEditor id="rolling-windows" label="Causal rolling windows" hint="Shifted by one row within group" disabled={locked} values={spec.preprocessing.rolling_windows.map(String)} onChange={(values) => updateSpec((draft) => { draft.preprocessing.rolling_windows = values.map(Number).filter((value) => Number.isInteger(value) && value > 1); })} />
  </section>;
}
