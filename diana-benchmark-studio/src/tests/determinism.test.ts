import { describe, expect, it } from "vitest";
import { customDefaultSpec } from "../catalog/hormonbench-v1";
import { canonicalize } from "../generator/canonical-json";
import { fingerprintTaskSpec } from "../generator/fingerprint";
import { generateProgramFiles } from "../generator/program-files";
describe("deterministic compilation", () => {
  it("canonicalizes object key order", () => { expect(canonicalize({ b: 2, a: { d: 4, c: 3 } })).toBe('{"a":{"c":3,"d":4},"b":2}'); });
  it("produces the same fingerprint and bytes", async () => { const a = await generateProgramFiles(customDefaultSpec); const b = await generateProgramFiles(structuredClone(customDefaultSpec)); expect(a.fingerprint).toBe(b.fingerprint); expect(a.files).toEqual(b.files); expect(a.manifest).toEqual(b.manifest); });
  it("changes fingerprint when a scientific field changes", async () => { const changed = structuredClone(customDefaultSpec); changed.task.history_window += 1; expect(await fingerprintTaskSpec(changed)).not.toBe(await fingerprintTaskSpec(customDefaultSpec)); });
});
