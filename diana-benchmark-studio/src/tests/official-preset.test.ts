import { describe, expect, it } from "vitest";
import { HORMONBENCH_PROVENANCE, HORMONBENCH_RESULTS, forkHormonbench, hormonbenchPreset } from "../catalog/hormonbench-v1";
import { fingerprintTaskSpec } from "../generator/fingerprint";
import { lintTaskSpec } from "../linter/scientific-linter";
import { generateNotebook } from "../generator/notebook";
import { generateProgramFiles } from "../generator/program-files";
import { parseImportedConfig } from "../generator/import-config";
describe("official Hormonbench preset", () => {
  it("freezes the verified identity and scientific counts", () => { expect(HORMONBENCH_PROVENANCE).toMatchObject({ task_id: "hormonbench_mcphases_interval2_nextday_v1", task_version: "1.0.0", participants: 20, origins: 1509, common_suffix_origins: 1369, folds: 5 }); expect(HORMONBENCH_PROVENANCE.baselines).toEqual(["population_median", "wearable_ridge", "catboost"]); expect(HORMONBENCH_PROVENANCE.reference_model).toBe("diana_h3p"); });
  it("reports evidence without promoting H3P", () => { expect(HORMONBENCH_RESULTS.cold_start[0].model).toBe("population_median"); expect(HORMONBENCH_RESULTS.few_shot.map((row) => row.leader)).toEqual(["population_median", "population_median", "catboost"]); expect(HORMONBENCH_RESULTS.few_shot[2].h3pScore).toBeGreaterThan(HORMONBENCH_RESULTS.few_shot[2].leaderScore); });
  it("passes lint as the sole implementation-validated preset", () => { expect(hormonbenchPreset.validation_level).toBe("implementation_validated_preset"); expect(lintTaskSpec(hormonbenchPreset).blocking).toHaveLength(0); });
  it("fork removes official status and changes identity", async () => { const fork = forkHormonbench(); expect(fork.official).toBeUndefined(); expect(fork.validation_level).toBe("scientifically_linted_draft"); expect(await fingerprintTaskSpec(fork)).not.toBe(await fingerprintTaskSpec(hormonbenchPreset)); });
  it("compiles an isolated static runner and exact public model identities", async () => {
    const notebook = await generateNotebook(hormonbenchPreset);
    const runner = notebook.cells.find((cell) => cell.id === "official-runner")?.source ?? "";
    expect(runner).toContain("shell=False");
    expect(runner).toContain("make_operational_configs");
    expect(runner).toContain("Refusing to overwrite existing run directory");
    expect(runner).not.toContain("os.system");
    const { manifest } = await generateProgramFiles(hormonbenchPreset);
    expect(manifest.selected_components.models).toEqual(["population_median", "wearable_ridge", "catboost"]);
  });
  it("rejects an imported preset whose frozen science was edited", () => {
    const forged = structuredClone(hormonbenchPreset);
    forged.task.history_window = 28;
    expect(() => parseImportedConfig(JSON.stringify(forged), "json")).toThrow(/immutable/);
  });
  it("accepts the three verified operational runner modes", () => {
    for (const runMode of ["preflight", "synthetic", "full"] as const) {
      const configured = structuredClone(hormonbenchPreset);
      configured.official!.run_mode = runMode;
      expect(parseImportedConfig(JSON.stringify(configured), "json").official?.run_mode).toBe(runMode);
    }
  });
});
