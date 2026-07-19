import { SliderNumberField } from "../controls/SliderNumberField";
import { SegmentedControl } from "../controls/SegmentedControl";
import { MODEL_CATALOG } from "../catalog/models";
import { TASK_TYPE_CATALOG } from "../catalog/task-types";
import type { MetricId, ModelId, TaskType } from "../contracts/task-spec";
import { useStudio } from "../workspace/studio-context";

export function TaskEditor() {
  const { spec, updateSpec } = useStudio(); const locked = spec.mode === "hormonbench_preset";
  const changeType = (type: TaskType) => updateSpec((draft) => {
    draft.task.type = type; const classification = type.includes("classification");
    const ids = (Object.keys(MODEL_CATALOG) as ModelId[]).filter((id) => MODEL_CATALOG[id].family === (classification ? "classification" : "regression"));
    draft.models = ids.slice(0, 2).map((id) => ({ id, parameters: structuredClone(MODEL_CATALOG[id].defaults) }));
    draft.metrics.primary = (classification ? "balanced_accuracy" : draft.data.group_column ? "group_macro_mae" : "mae") as MetricId;
    draft.metrics.secondary = (classification ? ["accuracy", "macro_f1"] : ["mae", "rmse"]) as MetricId[];
    if (classification && draft.data.target_columns.length > 1) { draft.data.target_columns = [draft.data.target_columns[0]]; draft.metrics.weights = { [draft.data.target_columns[0]]: 1 }; }
    if (type === "multi_target_regression" && draft.data.target_columns.length < 2) { draft.data.target_columns = [draft.data.target_columns[0], "target_b"]; draft.metrics.weights = { [draft.data.target_columns[0]]: .5, target_b: .5 }; }
    if (type === "longitudinal_next_step_regression") draft.data.layout = "longitudinal";
  });
  return <section className="editor-section" aria-labelledby="task-title"><header><p className="eyebrow">02 / Prediction task</p><h1 id="task-title">Freeze the forecast boundary</h1><p>For longitudinal programs, history and horizon are group-sorted observation steps. The target row is never part of the input window.</p></header>
    <SegmentedControl label="Task type" value={spec.task.type} options={TASK_TYPE_CATALOG} disabled={locked} onChange={changeType} />
    <SliderNumberField id="history-window" label="History window" hint="Observation steps available through the origin" value={spec.task.history_window} min={1} max={90} disabled={locked} onChange={(value) => updateSpec((draft) => { draft.task.history_window = value; })} />
    <SliderNumberField id="forecast-horizon" label="Forecast horizon" hint="Steps after the origin" value={spec.task.forecast_horizon} min={1} max={30} disabled={locked} onChange={(value) => updateSpec((draft) => { draft.task.forecast_horizon = value; })} />
    <label className="switch-row"><input type="checkbox" checked={spec.task.targets_nonnegative} disabled={locked} onChange={(event) => updateSpec((draft) => { draft.task.targets_nonnegative = event.currentTarget.checked; })} />Targets are nonnegative</label>
  </section>;
}
