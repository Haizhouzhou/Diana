import { canonicalize } from "./canonical-json";
import { fingerprintTaskSpec } from "./fingerprint";
import { normalizeTaskSpec } from "./normalize";
import { CUSTOM_EXECUTION_CODE, CUSTOM_EXPORT_CODE, CUSTOM_PROGRAM_CODE, OFFICIAL_RUNNER_CODE } from "./notebook-cells";
import { assertCompilationAllowed } from "./compile-guard";

export interface NotebookCell { cell_type: "markdown" | "code"; id: string; metadata: Record<string, never>; source: string; execution_count?: null; outputs?: never[] }
export interface NotebookDocument { cells: NotebookCell[]; metadata: Record<string, unknown>; nbformat: 4; nbformat_minor: 5 }

const markdown = (id: string, source: string): NotebookCell => ({ cell_type: "markdown", id, metadata: {}, source });
const code = (id: string, source: string): NotebookCell => ({ cell_type: "code", id, metadata: {}, source, execution_count: null, outputs: [] });

function toBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value); let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function compileNotebook(input: unknown, allowScientificBlockers: boolean): Promise<NotebookDocument> {
  const spec = normalizeTaskSpec(input); assertCompilationAllowed(spec, allowScientificBlockers); const canonical = canonicalize(spec); const fingerprint = await fingerprintTaskSpec(spec);
  const configCell = `import base64, json\nCONFIG = json.loads(\n    base64.b64decode("${toBase64Utf8(canonical)}").decode("utf-8")\n)\nPROGRAM_FINGERPRINT = "${fingerprint}"\nassert CONFIG["schema_version"] == 1\nprint({"fingerprint": PROGRAM_FINGERPRINT, "validation_level": CONFIG["validation_level"]})`;
  const commonStart = [
    markdown("program-title", `# ${spec.project.name}\n\n**Generated benchmark program** · Mode: \`${spec.mode}\` · Validation: \`${spec.validation_level}\` · Fingerprint: \`${fingerprint}\``),
    markdown("task-card", `## Generated task card\n\nTask: **${spec.task.type}**. History: ${spec.task.history_window} observation step(s). Horizon: ${spec.task.forecast_horizon}. Split: **${spec.split.type}**. Targets: ${spec.data.target_columns.map((value) => `\`${value}\``).join(", ")}.`),
    code("dependency-preflight", "import sys\nassert sys.version_info >= (3, 11), sys.version\nprint(sys.version)"),
    code("decode-config", configCell),
  ];
  const cells = spec.mode === "hormonbench_preset" ? [
    ...commonStart,
    markdown("official-provenance", "## Frozen Hormonbench provenance\n\nThis implementation-validated preset targets participant-entered at-home urinary monitor readings. Licensed mcPHASES data are supplied locally and are never included in this program."),
    markdown("official-preflight", "## Resolve the local repository and governed dataset\n\nSet `DIANA_REPO_ROOT` and `MCPHASES_DATA_ROOT`. The runner hash and static arguments are checked before execution."),
    code("official-runner", OFFICIAL_RUNNER_CODE),
    markdown("official-results", "## Aggregate evidence\n\nRead aggregate outputs from the local Diana results directory. Do not publish row predictions, participant IDs, fold mappings, or truth."),
    markdown("official-scope", "## Scientific scope\n\nHormonbench results are descriptive and post-hoc. Consumer urinary-monitor readings are not serum concentrations or clinical gold standards. This program makes no diagnostic or clinical claim."),
  ] : [
    ...commonStart,
    markdown("data-mode", "## Synthetic/local data mode\n\nSynthetic execution is labeled **SYNTHETIC EXAMPLE — NOT HEALTH DATA**. Local governed data use the fixed relative path in the configuration."),
    markdown("data-loading", "## CSV / Parquet loading\n\nThe selected registry-backed reader loads only the configured relative path. Parquet programs include `pyarrow`; synthetic mode exercises a real in-memory format round trip."),
    markdown("schema-validation", "## Schema validation\n\nRequired explicit roles are checked before transformations. Targets, IDs, groups, and time fields are excluded from ordinary predictors."),
    markdown("schema-summary", "## Aggregate schema summary\n\nThe program reports only row, missing-label, and feature counts—never participant rows or truth values."),
    code("program-functions", CUSTOM_PROGRAM_CODE),
    markdown("split-creation", "## Split creation\n\nThe deterministic registry-selected holdout uses the frozen seed and configured group or target-time key."),
    markdown("split-assertions", "## Split integrity assertions\n\nGroup splits assert zero overlap. Temporal partitions order aligned target time, not merely origin rows."),
    markdown("train-only", "## Train-only preprocessing\n\nEach estimator owns a fresh sklearn pipeline. Imputation, scaling, and encoding fit only on training rows."),
    markdown("causal-features", "## Causal feature generation\n\nLongitudinal lags and rolling windows are group-local, shifted, and stop at the origin cutoff."),
    markdown("model-training", "## Selected model training\n\nOnly typed registry estimators are constructed; targets, IDs, group keys, and time keys never enter the ordinary feature matrix."),
    markdown("predictions", "## Predictions\n\nPredictions use held-out rows only. Optional row predictions contain no truth and remain private on the researcher machine."),
    markdown("metric-evaluation", "## Metric evaluation\n\nThe primary and secondary metrics are compatibility-checked. Group-macro scores give each group equal influence; normalized log1p-MAE uses train-only target IQR."),
    code("execute-benchmark", CUSTOM_EXECUTION_CODE),
    markdown("leaderboard", "## Aggregate leaderboard\n\nThe exact numeric table ranks the selected models and records score direction."),
    markdown("leaderboard-plot", "## Accessible plot\n\nThe plot is paired with the exact leaderboard table; unavailable metrics carry an explicit status."),
    code("accessible-plot", "import matplotlib.pyplot as plt\nax = leaderboard.plot.bar(x='model', y='primary_score', legend=False, color='#167c78')\nax.set_ylabel(CONFIG['metrics']['primary']); ax.set_title('Aggregate synthetic benchmark result')\nplt.tight_layout(); plt.show()"),
    markdown("aggregate-export", "## Aggregate result export\n\nThe program writes `metrics.json` and `leaderboard.csv`. Optional row predictions are local/private."),
    code("export-results", CUSTOM_EXPORT_CODE),
    markdown("run-manifest", "## Run manifest export\n\n`run_manifest.json` records the fingerprint, runtime versions, split counts, seed, selected models, metrics, and prediction privacy state."),
    markdown("reproducibility", "## Reproducibility notes\n\nThe fingerprint identifies the normalized scientific configuration. Generated code uses registry-selected components and deterministic seeds."),
    markdown("scientific-scope", "## Scientific scope\n\nA scientifically linted draft is not clinical validation. Claims must follow the represented cohort and label provenance; overlapping longitudinal observations are not independent participants."),
  ];
  return { cells, metadata: { kernelspec: { display_name: "Python 3", language: "python", name: "python3" }, language_info: { name: "python", version: "3.11" }, diana_benchmark_studio: { generator_version: "1.0.0", fingerprint } }, nbformat: 4, nbformat_minor: 5 };
}

export function generateNotebook(input: unknown): Promise<NotebookDocument> { return compileNotebook(input, false); }
export function generateNotebookPreview(input: unknown): Promise<NotebookDocument> { return compileNotebook(input, true); }

export async function notebookBytes(input: unknown): Promise<Uint8Array> {
  return new TextEncoder().encode(`${JSON.stringify(await generateNotebook(input), null, 2)}\n`);
}

export async function notebookPreviewBytes(input: unknown): Promise<Uint8Array> {
  return new TextEncoder().encode(`${JSON.stringify(await generateNotebookPreview(input), null, 2)}\n`);
}

export function notebookOutline(notebook: NotebookDocument): { id: string; type: string; label: string }[] {
  return notebook.cells.map((cell) => ({ id: cell.id, type: cell.cell_type, label: cell.source.split("\n")[0].replace(/^#+\s*/, "").slice(0, 90) }));
}
