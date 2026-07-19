import type { TaskSpec } from "../contracts/task-spec";

export function generateDataCard(spec: TaskSpec): string {
  return `# Data card template

Complete this card before interpreting real-data results.

## Governed source

- Dataset owner/licence: [researcher to complete]
- Collection population and exclusions: [researcher to complete]
- Data format/layout: ${spec.data.format} / ${spec.data.layout}
- Relative local path: ${spec.data.path}
- Dataset rows redistributed by this kit: **none**

## Measurement semantics

- Target provenance: ${spec.data.target_provenance}
- Measurement context: ${spec.data.target_measurement_context}
- Missing-label mechanism: [researcher to document]
- Intended scope and unsupported groups: [researcher to document]

The included example is deterministic synthetic data and is not health data.
`;
}
