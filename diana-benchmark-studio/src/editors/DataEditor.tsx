import { ColumnRoleEditor } from "../controls/ColumnRoleEditor";
import { SegmentedControl } from "../controls/SegmentedControl";
import { DATA_FORMAT_CATALOG, DATA_LAYOUT_CATALOG } from "../catalog/data-types";
import { useStudio } from "../workspace/studio-context";
import { FeatureMetadataEditor } from "../controls/FeatureMetadataEditor";

export function DataEditor() {
  const { spec, updateSpec } = useStudio(); const locked = spec.mode === "hormonbench_preset";
  const data = spec.data; const set = <K extends keyof typeof data>(key: K, value: typeof data[K]) => updateSpec((draft) => {
    draft.data[key] = value;
    if (key === "format") draft.data.path = value === "parquet" ? "data/input.parquet" : "data/input.csv";
    if (key === "numeric_features" || key === "categorical_features") {
      const features = [...draft.data.numeric_features, ...draft.data.categorical_features];
      draft.data.feature_metadata = Object.fromEntries(features.map((feature) => [feature, draft.data.feature_metadata[feature] ?? { availability: "unknown", provenance: "unknown", derives_from_target: false }]));
    }
  });
  return <section className="editor-section" aria-labelledby="data-title"><header><p className="eyebrow">01 / Data contract</p><h1 id="data-title">Declare every column role</h1><p>Explicit feature lists prevent wildcard leakage. IDs, groups, time, and targets remain outside the ordinary predictor pipeline.</p></header>
    <SegmentedControl label="Data format" value={data.format} disabled={locked} options={DATA_FORMAT_CATALOG} onChange={(value) => set("format", value)} />
    <SegmentedControl label="Data structure" value={data.layout} disabled={locked} options={DATA_LAYOUT_CATALOG} onChange={(value) => set("layout", value)} />
    <div className="field-row"><div><label htmlFor="project-name">Program name</label><small>Human-readable; never inserted into generated code.</small></div><input id="project-name" value={spec.project.name} disabled={locked} onChange={(event) => updateSpec((draft) => { draft.project.name = event.currentTarget.value; })} /></div>
    <div className="field-row"><div><label htmlFor="project-slug">Download slug</label><small>Safe external filename only; internal kit paths are fixed.</small></div><input id="project-slug" value={spec.project.slug} disabled={locked} onChange={(event) => updateSpec((draft) => { draft.project.slug = event.currentTarget.value.toLowerCase(); })} /></div>
    <div className="field-row"><div><label htmlFor="task-id">Task ID</label><small>Stable lowercase identifier recorded in config and manifest.</small></div><input id="task-id" value={spec.project.task_id} disabled={locked} onChange={(event) => updateSpec((draft) => { draft.project.task_id = event.currentTarget.value.toLowerCase(); })} /></div>
    <ColumnRoleEditor id="numeric-features" label="Numeric features" values={data.numeric_features} disabled={locked} onChange={(value) => set("numeric_features", value)} />
    <ColumnRoleEditor id="categorical-features" label="Categorical features" values={data.categorical_features} disabled={locked} onChange={(value) => set("categorical_features", value)} />
    <FeatureMetadataEditor features={[...data.numeric_features, ...data.categorical_features]} metadata={data.feature_metadata} disabled={locked} onChange={(column, value) => updateSpec((draft) => { draft.data.feature_metadata[column] = value; })} />
    <ColumnRoleEditor id="target-columns" label="Target columns" values={data.target_columns} disabled={locked} onChange={(value) => updateSpec((draft) => { draft.data.target_columns = value; const weight = 1 / Math.max(1, value.length); draft.metrics.weights = Object.fromEntries(value.map((target) => [target, weight])); })} />
    <div className="field-grid three"><label>Identifier column<input id="id-column" value={data.id_column ?? ""} disabled={locked} placeholder="optional" onChange={(event) => set("id_column", event.currentTarget.value || null)} /></label><label>Group / participant<input id="group-column" value={data.group_column ?? ""} disabled={locked} placeholder="required for grouped" onChange={(event) => set("group_column", event.currentTarget.value || null)} /></label><label>Time column<input id="time-column" value={data.time_column ?? ""} disabled={locked} placeholder="required for temporal" onChange={(event) => set("time_column", event.currentTarget.value || null)} /></label></div>
    <div className="field-grid three"><label>Target provenance<select value={data.target_provenance} disabled={locked} onChange={(event) => set("target_provenance", event.currentTarget.value as typeof data.target_provenance)}><option value="measured">Measured</option><option value="derived">Derived</option><option value="weak">Weak / app label</option><option value="clinical">Clinical source</option></select></label><label>Measurement context<select value={data.target_measurement_context} disabled={locked} onChange={(event) => set("target_measurement_context", event.currentTarget.value as typeof data.target_measurement_context)}><option value="other">Other</option><option value="urinary_monitor">Urinary monitor</option><option value="serum">Serum</option><option value="unknown">Unknown</option></select></label><label className="switch-row"><input type="checkbox" checked={data.target_derived_predictors} disabled={locked} onChange={(event) => set("target_derived_predictors", event.currentTarget.checked)} />Predictors derived from targets</label></div>
  </section>;
}
