import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { TaskSpec } from "../contracts/task-spec";
import { customDefaultSpec, forkHormonbench, hormonbenchPreset } from "../catalog/hormonbench-v1";
import { lintTaskSpec } from "../linter/scientific-linter";
import type { NotebookDocument } from "../generator/notebook";
import { previewProgramFiles } from "../generator/program-files";
import { StudioContext, type CompiledState, type StudioContextValue, type StageId } from "./studio-context";

export function StudioProvider({ children }: { children: ReactNode }) {
  const [spec, setSpec] = useState<TaskSpec>(() => structuredClone(customDefaultSpec));
  const [stage, setStage] = useState<StageId>("data"); const history = useRef<TaskSpec[]>([]); const future = useRef<TaskSpec[]>([]);
  const [compiled, setCompiled] = useState<CompiledState | null>(null); const [compiling, setCompiling] = useState(true);
  const lint = useMemo(() => lintTaskSpec(spec), [spec]);
  useEffect(() => {
    let active = true; setCompiling(true);
    previewProgramFiles(spec).then(({ spec: normalizedSpec, fingerprint, files, manifest }) => ({ normalizedSpec, fingerprint, files, manifest, notebook: JSON.parse(new TextDecoder().decode(files["diana-benchmark-program/benchmark.ipynb"])) as NotebookDocument }))
      .then((value) => { if (active) setCompiled(value); }).catch(() => { if (active) setCompiled(null); }).finally(() => { if (active) setCompiling(false); });
    return () => { active = false; };
  }, [spec]);
  const replace = useCallback((next: TaskSpec) => { history.current.push(structuredClone(spec)); future.current = []; setSpec(structuredClone(next)); }, [spec]);
  const updateSpec = useCallback((updater: (draft: TaskSpec) => void) => { const next = structuredClone(spec); updater(next); replace(next); }, [replace, spec]);
  const value: StudioContextValue = {
    spec, lint, compiled, compiling, stage, setStage, updateSpec, replaceSpec: replace,
    loadPreset: () => { replace(hormonbenchPreset); setStage("review"); },
    forkPreset: () => { replace(forkHormonbench()); setStage("data"); },
    reset: () => { replace(customDefaultSpec); setStage("data"); },
    undo: () => { const previous = history.current.pop(); if (previous) { future.current.push(structuredClone(spec)); setSpec(previous); } },
    redo: () => { const next = future.current.pop(); if (next) { history.current.push(structuredClone(spec)); setSpec(next); } },
    canUndo: history.current.length > 0,
    canRedo: future.current.length > 0,
  };
  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}
