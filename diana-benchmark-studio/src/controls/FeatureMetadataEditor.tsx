import type { FeatureMetadata } from "../contracts/task-spec";

interface FeatureMetadataEditorProps {
  features: string[];
  metadata: Record<string, FeatureMetadata>;
  disabled?: boolean;
  onChange: (column: string, value: FeatureMetadata) => void;
}

export function FeatureMetadataEditor({ features, metadata, disabled = false, onChange }: FeatureMetadataEditorProps) {
  return <div className="table-scroll"><table className="config-table"><caption>Feature availability and provenance</caption><thead><tr><th>Feature</th><th>Available</th><th>Provenance</th><th>Target-derived</th></tr></thead><tbody>{features.map((column) => { const value = metadata[column]; return <tr key={column}><th scope="row"><code>{column}</code></th><td><select aria-label={`${column} availability`} value={value?.availability ?? "unknown"} disabled={disabled} onChange={(event) => onChange(column, { ...(value ?? { provenance: "unknown", derives_from_target: false }), availability: event.currentTarget.value as FeatureMetadata["availability"] })}><option value="at_or_before_origin">At/before origin</option><option value="after_origin">After origin</option><option value="unknown">Unknown</option></select></td><td><select aria-label={`${column} provenance`} value={value?.provenance ?? "unknown"} disabled={disabled} onChange={(event) => onChange(column, { ...(value ?? { availability: "unknown", derives_from_target: false }), provenance: event.currentTarget.value as FeatureMetadata["provenance"] })}><option value="measured">Measured</option><option value="derived">Derived</option><option value="unknown">Unknown</option></select></td><td><input aria-label={`${column} derives from target`} type="checkbox" checked={value?.derives_from_target ?? false} disabled={disabled} onChange={(event) => onChange(column, { ...(value ?? { availability: "unknown", provenance: "unknown" }), derives_from_target: event.currentTarget.checked })} /></td></tr>; })}</tbody></table></div>;
}
