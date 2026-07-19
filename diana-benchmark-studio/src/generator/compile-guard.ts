import { hormonbenchPreset } from "../catalog/hormonbench-v1";
import type { TaskSpec } from "../contracts/task-spec";
import { lintTaskSpec } from "../linter/scientific-linter";
import { canonicalize } from "./canonical-json";
import { normalizeTaskSpec } from "./normalize";

export function assertCompilationAllowed(spec: TaskSpec, allowScientificBlockers = false): void {
  if (spec.mode === "hormonbench_preset") {
    const candidate = structuredClone(spec);
    candidate.official.run_mode = hormonbenchPreset.official!.run_mode;
    if (canonicalize(candidate) !== canonicalize(normalizeTaskSpec(hormonbenchPreset))) {
      throw new Error("The implementation-validated Hormonbench preset is immutable; fork it before editing scientific fields");
    }
  }
  if (!allowScientificBlockers) {
    const blockers = lintTaskSpec(spec).blocking;
    if (blockers.length) throw new Error(`Scientific lint blocked compilation: ${blockers.map((item) => item.id).join(", ")}`);
  }
}
