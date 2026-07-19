export interface ProgramManifest {
  schema_version: 1;
  generator: { name: "Diana Benchmark Studio"; version: string; template_version: string };
  mode: "custom" | "hormonbench_preset";
  validation_level: string;
  kit_id: string;
  task_config_sha256: string;
  notebook_sha256: string;
  task_identity: { name: string; task_id?: string; version?: string };
  selected_components: { models: string[]; metrics: string[]; split: string };
  files: Record<string, string>;
  expected_outputs: string[];
  source_provenance?: Record<string, string>;
}
