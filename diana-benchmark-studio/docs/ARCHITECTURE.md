# Diana Benchmark Studio architecture

The Studio is a static, browser-local visual benchmark program compiler. Its single compilation path is:

`UI state -> typed TaskSpec -> strict schema -> scientific lint -> normalized IR -> canonical JSON -> SHA-256 fingerprint -> Notebook/docs/schemas -> manifest -> deterministic ZIP`.

React owns editing and preview only. `src/contracts`, `src/linter`, and `src/generator` contain DOM-free pure compiler logic. Every preview and export is produced from one immutable normalized snapshot. User strings are configuration data; trusted static templates are the only generated Python and shell source.

## Validation levels

- **Implementation-validated preset**: frozen Hormonbench-mcPHASES v1 contract, source provenance, runner interface, and aggregate evidence verified in the Diana repository.
- **Scientifically linted draft**: a custom program whose schema and deterministic scientific rules pass. This does not imply empirical or clinical validation.

Generated programs execute on the researcher's machine. The deployed Studio has no backend, analytics, dataset upload, runtime code execution, or third-party scripts.
