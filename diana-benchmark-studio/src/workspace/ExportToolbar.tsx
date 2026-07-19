import { Download, FileJson2, NotebookTabs } from "lucide-react";
import { downloadBlob, downloadBytes, sanitizeDownloadSlug } from "../generator/download";
import { generateZipFromFiles } from "../generator/zip";
import { useStudio } from "./studio-context";

export function ExportToolbar({ compact = false }: { compact?: boolean }) {
  const { spec, lint, compiled, compiling } = useStudio(); const disabled = !compiled || compiling || !lint.canGenerate;
  const notebook = () => { if (!compiled) return; downloadBytes(compiled.files["diana-benchmark-program/benchmark.ipynb"], `${sanitizeDownloadSlug(spec.project.slug)}.ipynb`, "application/x-ipynb+json"); };
  const config = () => { if (!compiled) return; downloadBytes(new TextEncoder().encode(`${JSON.stringify(compiled.normalizedSpec, null, 2)}\n`), `${sanitizeDownloadSlug(spec.project.slug)}.benchmark.json`, "application/json"); };
  const kit = async () => { if (!compiled) return; downloadBlob(await generateZipFromFiles(compiled.files), `${sanitizeDownloadSlug(spec.project.slug)}-benchmark-kit.zip`); };
  return <div className={`export-toolbar ${compact ? "compact" : ""}`} aria-label="Program exports"><button type="button" disabled={disabled} onClick={notebook}><NotebookTabs size={16} />{compact ? "Notebook" : "Download Notebook"}</button><button type="button" disabled={disabled} onClick={() => void kit()}><Download size={16} />{compact ? "Kit" : "Download Benchmark Kit"}</button><button type="button" disabled={disabled} onClick={config}><FileJson2 size={16} />{compact ? "Config" : "Download Config"}</button></div>;
}
