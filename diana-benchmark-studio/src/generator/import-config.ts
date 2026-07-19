import { load, JSON_SCHEMA } from "js-yaml";
import { parseTaskSpec, type TaskSpec } from "../contracts/task-spec";
import { hormonbenchPreset } from "../catalog/hormonbench-v1";
import { canonicalize } from "./canonical-json";
import { normalizeTaskSpec } from "./normalize";

const MAX_CONFIG_BYTES = 256 * 1024;

export function parseImportedConfig(text: string, extension: "json" | "yaml" | "yml"): TaskSpec {
  if (new TextEncoder().encode(text).byteLength > MAX_CONFIG_BYTES) throw new Error("Configuration exceeds the 256 KiB import limit");
  if (extension !== "json" && (/(?:^|[\s,[{])[&*][A-Za-z0-9_-]+/m.test(text) || text.includes("!!"))) throw new Error("YAML aliases, anchors, and explicit tags are not accepted");
  const input = extension === "json" ? JSON.parse(text) : load(text, { schema: JSON_SCHEMA, json: false });
  const parsed = parseTaskSpec(input);
  if (parsed.mode === "hormonbench_preset") {
    const scientific = structuredClone(parsed);
    if (scientific.official) scientific.official.run_mode = hormonbenchPreset.official!.run_mode;
    if (canonicalize(normalizeTaskSpec(scientific)) !== canonicalize(normalizeTaskSpec(hormonbenchPreset))) {
      throw new Error("The implementation-validated Hormonbench preset is immutable; use Fork as custom benchmark before editing it");
    }
  }
  return parsed;
}
