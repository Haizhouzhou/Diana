import { useState } from "react";
import { CommandBar } from "./CommandBar";
import { ConfigurationCanvas } from "./ConfigurationCanvas";
import { InspectorPane } from "./InspectorPane";
import { ProtocolRail } from "./ProtocolRail";
import { ValidationConsole } from "./ValidationConsole";
export function WorkspaceShell() {
  const [inspectorOpen, setInspectorOpen] = useState(() => window.innerWidth >= 1200);
  return <div className={`workspace-shell ${inspectorOpen ? "inspector-open" : "inspector-closed"}`}><CommandBar inspectorOpen={inspectorOpen} onToggleInspector={() => setInspectorOpen((open) => !open)} /><div className="workspace-body"><ProtocolRail /><ConfigurationCanvas /><InspectorPane open={inspectorOpen} onClose={() => setInspectorOpen(false)} /></div><ValidationConsole /></div>;
}
