import { useState } from "react";
import { X } from "lucide-react";
import { canonicalize } from "../generator/canonical-json";
import { NotebookPreview } from "../visualization/NotebookPreview";
import { KitFileTree } from "../visualization/KitFileTree";
import { TemporalProtocol } from "../visualization/TemporalProtocol";
import { PipelineGraph } from "../visualization/PipelineGraph";
import { SplitDiagram } from "../visualization/SplitDiagram";
import { DataBoundary } from "../visualization/DataBoundary";
import { useStudio } from "./studio-context";
type Tab = "protocol" | "notebook" | "files" | "manifest";
interface InspectorPaneProps { open: boolean; onClose: () => void }

export function InspectorPane({ open, onClose }: InspectorPaneProps) { const { spec, compiled, compiling } = useStudio(); const [tab, setTab] = useState<Tab>("protocol"); const tabs: Tab[] = ["protocol", "notebook", "files", "manifest"]; return <aside className="inspector" aria-label="Live protocol inspector" hidden={!open}><div className="inspector-heading"><span>Live inspector</span><button type="button" onClick={onClose} aria-label="Close inspector"><X size={15} /></button></div><div className="inspector-tabs" role="tablist">{tabs.map((value) => <button id={`inspector-tab-${value}`} aria-controls={`inspector-panel-${value}`} type="button" role="tab" aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} key={value} onClick={() => setTab(value)}>{value}</button>)}</div><div id={`inspector-panel-${tab}`} aria-labelledby={`inspector-tab-${tab}`} className="inspector-content" role="tabpanel">{compiling && <p className="loading-line">Compiling deterministic preview…</p>}{tab === "protocol" && <><TemporalProtocol spec={spec} /><SplitDiagram spec={spec} /><PipelineGraph spec={spec} /><DataBoundary /><details><summary>Normalized configuration</summary><pre>{compiled ? canonicalize(compiled.normalizedSpec) : canonicalize(spec)}</pre></details></>}{tab === "notebook" && compiled && <NotebookPreview notebook={compiled.notebook} />}{tab === "files" && compiled && <KitFileTree paths={Object.keys(compiled.files)} />}{tab === "manifest" && compiled && <><dl className="manifest-facts"><dt>Kit ID</dt><dd>{compiled.manifest.kit_id}</dd><dt>Notebook SHA-256</dt><dd>{compiled.manifest.notebook_sha256}</dd><dt>Task SHA-256</dt><dd>{compiled.manifest.task_config_sha256}</dd></dl><pre>{JSON.stringify(compiled.manifest, null, 2)}</pre></>}</div></aside>; }
