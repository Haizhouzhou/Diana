import type { TaskSpec } from "../contracts/task-spec";

export function generateTaskCard(spec: TaskSpec, fingerprint: string): string {
  if (spec.mode === "hormonbench_preset") return `# Hormonbench-mcPHASES v1 task card

- Program fingerprint: \`${fingerprint}\`
- Task ID/version: \`${spec.official.task_id}\` / \`${spec.official.task_version}\`
- Validation: implementation-validated preset
- Cohort: mcPHASES Interval 2, ${spec.official.eligible_participants} eligible participants and ${spec.official.eligible_origins} eligible origins
- Inputs: approved causal wearable summaries from exactly \`t-13\` through \`t\`
- Targets: genuinely observed participant-entered urinary LH, E3G, and PdG monitor readings at \`t+1\`
- Cold-start split: five deterministic participant-disjoint folds; final fit 16 development participants / 4 held-out participants
- Personalization: K=0/3/7 earliest complete tri-hormone observations, all scored on the same ${spec.official.common_suffix_origins}-origin suffix
- Primary metric: participant-macro log1p-MAE, normalized with fold-specific development-only IQRs
- Classical baselines: \`population_median\`, \`wearable_ridge\`, \`catboost\`
- Reference model: \`diana_h3p\`

## Cutoff and leakage contract

Participant/sample IDs, absolute dates, menstrual-calendar fields, self-reports, hormone history, target-derived labels, future summaries, interpolation, backward filling, and centered windows are forbidden. Targets are genuinely observed and never interpolated. The morning \`t+1\` target cannot use summaries that become available after the cutoff.

## Scope

These are consumer urinary-monitor readings, not serum concentrations or clinical gold standards. Results are aggregate, descriptive, post-hoc, nonclinical evidence from a small cohort with correlated origins.
`;
  return `# ${spec.project.name} task card

- Program fingerprint: \`${fingerprint}\`
- Mode: \`${spec.mode}\`
- Validation level: \`${spec.validation_level}\`
- Task: \`${spec.task.type}\`
- Data: \`${spec.data.format}\`, \`${spec.data.layout}\`
- Inputs: ${spec.data.numeric_features.concat(spec.data.categorical_features).map((value) => `\`${value}\``).join(", ")}
- Targets: ${spec.data.target_columns.map((value) => `\`${value}\``).join(", ")}
- Split: \`${spec.split.type}\`
- History/horizon: ${spec.task.history_window}/${spec.task.forecast_horizon} observation steps
- Primary metric: \`${spec.metrics.primary}\`

## Cutoff and leakage contract

IDs, group keys, time keys, and targets are not ordinary predictors. Longitudinal lags and rolling windows are group-local and shifted. Labels are never imputed as input. The generated split and preprocessing assertions run before evaluation.

## Scope

Target provenance is **${spec.data.target_provenance}** and measurement context is **${spec.data.target_measurement_context}**. Passing Studio linting does not establish clinical validation, diagnosis, causal effects, or population generality.
`;
}
