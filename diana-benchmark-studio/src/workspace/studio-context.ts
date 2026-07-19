import { createContext, useContext } from "react";
import type { TaskSpec } from "../contracts/task-spec";
import type { LintResult } from "../linter/scientific-linter";
import type { NotebookDocument } from "../generator/notebook";
import type { ProgramFileMap } from "../generator/program-files";
import type { ProgramManifest } from "../contracts/program-manifest";

export type StageId = "data" | "task" | "split" | "preprocessing" | "models" | "metrics" | "review";

export interface CompiledState {
  normalizedSpec: TaskSpec;
  fingerprint: string;
  notebook: NotebookDocument;
  files: ProgramFileMap;
  manifest: ProgramManifest;
}

export interface StudioContextValue {
  spec: TaskSpec;
  lint: LintResult;
  compiled: CompiledState | null;
  compiling: boolean;
  stage: StageId;
  setStage: (stage: StageId) => void;
  updateSpec: (updater: (draft: TaskSpec) => void) => void;
  replaceSpec: (spec: TaskSpec) => void;
  loadPreset: () => void;
  forkPreset: () => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const value = useContext(StudioContext);
  if (!value) throw new Error("useStudio requires StudioProvider");
  return value;
}
