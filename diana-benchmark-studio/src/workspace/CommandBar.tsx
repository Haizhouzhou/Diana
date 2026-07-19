import { FileUp, PanelRightClose, PanelRightOpen, Redo2, RotateCcw, Undo2 } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import dianaWordmark from "../assets/brand/diana-wordmark.svg";
import { parseImportedConfig } from "../generator/import-config";
import { validationLabels } from "../contracts/validation-level";
import { ExportToolbar } from "./ExportToolbar";
import { useStudio } from "./studio-context";
interface CommandBarProps { inspectorOpen: boolean; onToggleInspector: () => void }

export function CommandBar({ inspectorOpen, onToggleInspector }: CommandBarProps) {
  const { spec, compiled, replaceSpec, undo, redo, canUndo, canRedo, reset } = useStudio();
  const input = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");
  const importFile = async (file: File) => { try { if (file.size > 256 * 1024) throw new Error("Configuration exceeds the 256 KiB import limit"); const extension = file.name.toLowerCase().endsWith(".json") ? "json" : file.name.toLowerCase().endsWith(".yml") ? "yml" : "yaml"; replaceSpec(parseImportedConfig(await file.text(), extension)); setImportError(""); } catch (error) { setImportError(error instanceof Error ? error.message : "Configuration import failed"); } };
  const modeLabel = spec.mode === "hormonbench_preset" ? "Hormonbench preset" : "Custom benchmark";
  return <header className="command-bar"><Link className="studio-mark" to="/" aria-label="Diana Benchmark Studio home"><img src={dianaWordmark} width="102" height="41" alt="Diana" /><span className="studio-product"><strong>Benchmark Studio</strong><small>{spec.project.name}</small></span></Link><div className="command-meta"><span className="mode-state"><i aria-hidden="true" />{modeLabel}</span><span className="validation-level"><i aria-hidden="true" />{validationLabels[spec.validation_level]}</span><code title={compiled?.fingerprint}>{compiled ? compiled.fingerprint.slice(0, 12) : "compiling…"}</code>{importError && <span role="alert" className="import-error">Import rejected: {importError}</span>}</div><div className="command-actions"><button type="button" onClick={undo} disabled={!canUndo} title="Undo" aria-label="Undo"><Undo2 size={15} /><span>Undo</span></button><button type="button" onClick={redo} disabled={!canRedo} title="Redo" aria-label="Redo"><Redo2 size={15} /><span>Redo</span></button><button type="button" onClick={reset} title="Reset custom program" aria-label="Reset custom program"><RotateCcw size={15} /><span>Reset</span></button><button type="button" onClick={() => input.current?.click()} title="Import configuration" aria-label="Import configuration"><FileUp size={15} /><span>Import</span></button><input ref={input} hidden type="file" accept="application/json,.json,.yaml,.yml" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void importFile(file); event.currentTarget.value = ""; }} /><ExportToolbar compact /><button type="button" onClick={onToggleInspector} title={inspectorOpen ? "Collapse inspector" : "Open inspector"} aria-label={inspectorOpen ? "Collapse inspector" : "Open inspector"} aria-expanded={inspectorOpen}><span className="icon-open">{inspectorOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}</span><span>Inspector</span></button></div></header>;
}
