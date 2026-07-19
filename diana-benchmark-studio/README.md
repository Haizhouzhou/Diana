# Diana Benchmark Studio

Diana Benchmark Studio is a frontend-only **Visual Benchmark Program Compiler**. It converts a typed visual research protocol into a deterministic, executable, and testable local benchmark program.

`Configure -> Scientific lint -> Preview -> Fingerprint -> Download Notebook / Benchmark Kit -> Run locally`

## Product modes

- **Hormonbench-mcPHASES v1** is the only current implementation-validated preset. Its scientific task is locked; supported runner modes are preflight, synthetic smoke, and full licensed-data execution.
- **Custom benchmark** supports CSV/Parquet, static/grouped/longitudinal layouts, regression/classification/next-step tasks, random/group/temporal holds, explicit preprocessing, up to three classical models, and compatible metrics.
- **Fork Hormonbench** retains useful starting structure while removing official hashes, validation status, and canonical leaderboard comparability.

## Local development

Activate a Python environment containing `nbformat`, `nbclient`, `ipykernel`, `pandas`, `scikit-learn`, and `pyarrow` before Notebook verification. In the Diana development workspace this is the `ai` Conda environment; Studio does not hard-code a machine-specific interpreter path.

```powershell
conda activate ai
npm ci
npm run lint
npm run typecheck
npm run test
npm run verify:notebooks
npm run build
```

Notebook verification uses the active Python environment and executes seven deterministic clean-kernel cases. The Vite app performs no Notebook execution, dataset upload, analytics, tracking, or backend calls.

## Compiler boundary

One normalized intermediate representation drives validation, canonical JSON, SHA-256 fingerprint, preview, Notebook, documentation, manifest, and deterministic ZIP. User strings remain configuration data encoded as UTF-8 Base64; only trusted static templates produce Python and launch scripts.

See [architecture](docs/ARCHITECTURE.md), [generation contract](docs/GENERATION_CONTRACT.md), [scientific linter](docs/SCIENTIFIC_LINTER.md), and [privacy boundary](docs/PRIVACY.md).

## Scientific scope

Studio-generated custom programs are scientifically linted drafts, not clinical validation. Hormonbench targets participant-entered at-home urinary monitor readings, not serum concentrations or clinical gold standards. Its evidence is descriptive and post-hoc. Users must obtain mcPHASES directly under its data-use agreement; Diana redistributes no dataset rows.
