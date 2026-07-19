import { zodToJsonSchema } from "zod-to-json-schema";
import { taskSpecSchema, type TaskSpec } from "../contracts/task-spec";

export function configJsonSchema(): string {
  const schema = zodToJsonSchema(taskSpecSchema, {
    name: "DianaBenchmarkStudioTaskSpec",
    target: "jsonSchema7",
    $refStrategy: "none",
    effectStrategy: "input",
  });
  return `${JSON.stringify(schema, null, 2)}\n`;
}

export function predictionSchema(spec: TaskSpec): string {
  if (spec.mode === "hormonbench_preset") {
    const properties = {
      task_id: { const: spec.official.task_id }, task_version: { const: spec.official.task_version },
      track: { enum: ["cold_start_participant_independent", "few_shot_personalization"] },
      fold: { type: "integer", minimum: 0, maximum: 4 }, calibration_budget: { enum: [0, 3, 7] }, split: { const: "test" },
      sample_id: { type: "string", minLength: 1 }, hormone: { enum: ["lh", "e3g", "pdg"] }, horizon: { const: 1 },
      y_pred: { type: "number", minimum: 0 }, model_name: { enum: [...spec.official.baseline_ids, spec.official.reference_model] },
      model_version: { type: "string", minLength: 1 }, y_lower: { type: "number", minimum: 0 }, y_upper: { type: "number", minimum: 0 },
    };
    return `${JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", title: "Private Hormonbench v1 prediction rows", type: "array", items: { type: "object", additionalProperties: false, required: ["task_id", "task_version", "track", "fold", "calibration_budget", "split", "sample_id", "hormone", "horizon", "y_pred", "model_name", "model_version"], properties } }, null, 2)}\n`;
  }
  const models = spec.models.map((model) => model.id);
  return `${JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", title: "Private prediction rows", type: "array", items: { type: "object", additionalProperties: false, required: ["model", "target", "row_index", "prediction"], properties: { model: { enum: models }, target: { enum: spec.data.target_columns }, row_index: { type: "integer", minimum: 0 }, prediction: { type: ["number", "string"] } } } }, null, 2)}\n`;
}

export function publicResultSchema(spec: TaskSpec): string {
  if (spec.mode === "hormonbench_preset") {
    const required = ["calibration_budget", "model_name", "track", "participants", "origins", "overall_normalized_score", "fold_score_mean", "fold_score_sd", "lh_participant_macro_log1p_mae", "e3g_participant_macro_log1p_mae", "pdg_participant_macro_log1p_mae"];
    return `${JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", title: "Aggregate Hormonbench v1 leaderboard", type: "array", items: { type: "object", required, properties: { calibration_budget: { enum: [0, 3, 7] }, model_name: { enum: [...spec.official.baseline_ids, spec.official.reference_model] }, track: { enum: ["cold_start_participant_independent", "few_shot_personalization"] }, participants: { type: "integer", minimum: 1 }, origins: { type: "integer", minimum: 1 }, overall_normalized_score: { type: "number" }, fold_score_mean: { type: "number" }, fold_score_sd: { type: "number", minimum: 0 }, lh_participant_macro_log1p_mae: { type: "number", minimum: 0 }, e3g_participant_macro_log1p_mae: { type: "number", minimum: 0 }, pdg_participant_macro_log1p_mae: { type: "number", minimum: 0 } } } }, null, 2)}\n`;
  }
  return `${JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", title: "Aggregate leaderboard", type: "array", items: { type: "object", additionalProperties: true, required: ["model", "split", "primary_metric", "primary_score", "lower_is_better"], properties: { model: { type: "string" }, split: { const: "test" }, primary_metric: { type: "string" }, primary_score: { type: "number" }, lower_is_better: { type: "boolean" } } } }, null, 2)}\n`;
}
