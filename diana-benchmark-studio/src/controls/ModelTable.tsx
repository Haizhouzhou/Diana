import { MODEL_CATALOG } from "../catalog/models";
import type { ModelId, TaskSpec } from "../contracts/task-spec";

export function ModelTable({ spec, onChange, disabled = false }: { spec: TaskSpec; onChange: (models: TaskSpec["models"]) => void; disabled?: boolean }) {
  const family = spec.task.type.includes("classification") ? "classification" : "regression";
  const available = (Object.keys(MODEL_CATALOG) as ModelId[]).filter((id) => MODEL_CATALOG[id].family === family);
  const toggle = (id: ModelId) => {
    const current = spec.models.find((model) => model.id === id);
    if (current) onChange(spec.models.filter((model) => model.id !== id));
    else if (spec.models.length < 3) onChange([...spec.models, { id, parameters: structuredClone(MODEL_CATALOG[id].defaults) }]);
  };
  const parameter = (id: ModelId, key: string, value: number) => onChange(spec.models.map((model) => model.id === id ? { ...model, parameters: { ...model.parameters, [key]: value } } : model));
  return <div className="table-scroll"><table className="config-table"><caption>Classical model configuration — select one to three</caption><thead><tr><th scope="col">Use</th><th scope="col">Model</th><th scope="col">Typed parameters</th></tr></thead><tbody>{available.map((id) => { const selected = spec.models.find((model) => model.id === id); return <tr key={id}><td><input aria-label={`Use ${MODEL_CATALOG[id].label}`} type="checkbox" checked={Boolean(selected)} disabled={disabled || (!selected && spec.models.length >= 3)} onChange={() => toggle(id)} /></td><th scope="row">{MODEL_CATALOG[id].label}</th><td>{selected && Object.entries(selected.parameters).map(([key, value]) => typeof value === "number" ? <label className="inline-param" key={key}>{key}<input type="number" value={value} min={key === "n_estimators" ? 10 : 0.001} max={key === "n_estimators" ? 500 : 1000} disabled={disabled} onChange={(event) => parameter(id, key, event.currentTarget.valueAsNumber)} /></label> : <code key={key}>{key}={String(value)}</code>)}{selected && !Object.keys(selected.parameters).length && <span className="muted">No parameters</span>}</td></tr>; })}</tbody></table><p className="table-note">{spec.models.length}/3 selected</p></div>;
}
