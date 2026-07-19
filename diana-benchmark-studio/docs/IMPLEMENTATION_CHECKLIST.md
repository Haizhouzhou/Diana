# Diana Benchmark Studio implementation checklist

This checklist is the completion gate. Every item starts unchecked and may be checked only after implementation and executable verification.

## A. Product modes and positioning

- [ ] Hormonbench-mcPHASES v1 is available as the only implementation-validated preset.
- [ ] A custom benchmark program can be configured and generated.
- [ ] Hormonbench can be forked into a new custom task with official hashes/results removed.
- [ ] Validation level is explicit in UI, config, Notebook, and manifest.
- [ ] Donation App, Studio, Hormonbench, and Diana-H3P retain the documented hierarchy.
- [ ] Diana-H3P is identified as a reference model, not a fourth classical baseline.
- [ ] Product language states: “Diana connects responsible contribution to comparable evidence.”

## B. Research configuration

- [ ] CSV and Parquet data formats are configurable and executable.
- [ ] Static, grouped/participant, and longitudinal tabular layouts are configurable.
- [ ] Single-target regression is supported.
- [ ] Multi-target regression is supported.
- [ ] Binary classification is supported.
- [ ] Multiclass classification is supported.
- [ ] Longitudinal next-step regression is supported.
- [ ] Numeric feature columns are explicitly editable.
- [ ] Categorical feature columns are explicitly editable.
- [ ] Target columns are explicitly editable and separate from features.
- [ ] ID, group, and time columns are separately configurable.
- [ ] Per-column availability, provenance, target derivation, and measurement context are represented.
- [ ] History window and forecast horizon are numeric controlled values.
- [ ] Random holdout is supported where scientifically compatible.
- [ ] Group-disjoint holdout and its fractions are supported.
- [ ] Temporal holdout and its ordered fractions are supported.
- [ ] Numeric median imputation is supported.
- [ ] Standard, robust, and no scaling are supported.
- [ ] Categorical most-frequent imputation is supported.
- [ ] One-hot encoding is supported.
- [ ] Causal lags and rolling windows are supported.
- [ ] One to three compatible classical models can be selected.
- [ ] Typed model parameters are editable and range validated.
- [ ] A unique compatible primary metric is configurable.
- [ ] Compatible secondary metrics are configurable.
- [ ] Multi-target metric weights are validated and normalized.
- [ ] Runtime seed and workers are configurable.
- [ ] Results directory and aggregate/private-prediction output behavior are configurable.
- [ ] Notebook execution mode is configurable.

## C. Scientific tooling

- [ ] Scientific linter is deterministic and React-independent.
- [ ] Linter returns blocking issues, warnings, passed checks, fields, reasons, and actions.
- [ ] Forecast origin, target horizon, and causal cutoff are explicit.
- [ ] Lags/rolling windows cannot use data after origin.
- [ ] Temporal partitions use ordered target time and reject cross-boundary labels.
- [ ] Target-day/future information is excluded from inputs.
- [ ] Group-disjoint partitions assert zero group overlap.
- [ ] Random-row split blocks grouped/longitudinal participant tasks.
- [ ] Group identifiers are excluded from predictors.
- [ ] Group-macro metrics require a group field.
- [ ] Imputer, scaler, encoder, and feature transforms fit on training only.
- [ ] Validation/test mutations cannot change fitted preprocessing.
- [ ] Targets are never imputed as input features.
- [ ] Missing labels are transparently excluded and counted.
- [ ] Classification requires exactly one target.
- [ ] Regression target and layout requirements are enforced.
- [ ] Longitudinal tasks require group, time, history, horizon, and unique group-time rows.
- [ ] Parquet adds and executes with pyarrow.
- [ ] Regression/classification model compatibility is enforced.
- [ ] No more than three models can be selected.
- [ ] ROC-AUC is restricted to binary classification.
- [ ] Log1p metrics require nonnegative targets and train-only stable IQR.
- [ ] Pearson R is distinguished from R² and unavailable when undefined.
- [ ] Metric weights are finite, nonnegative, and normalized.
- [ ] Target provenance supports measured, derived, weak, and clinical declarations.
- [ ] Urinary-monitor and serum semantics remain distinct.
- [ ] Target-derived labels cannot be ordinary predictors.
- [ ] Future completed-cycle information is rejected as causal input.
- [ ] Participant-independent evaluation is recommended for longitudinal hormonal data.
- [ ] Compared personalization budgets require an identical scoring cohort.
- [ ] Claims are bounded by represented population and label provenance.
- [ ] Fork-random-split leakage demonstration produces and clears an actionable blocker.
- [ ] Live temporal, split, pipeline, and data-boundary visualizations reflect the same IR.

## D. Compiler and generated program

- [ ] Versioned discriminated-union TaskSpec is implemented.
- [ ] Normalized intermediate representation is the single compiler source.
- [ ] Canonical JSON is deterministic.
- [ ] SHA-256 fingerprint is generated from normalized canonical configuration.
- [ ] Core compiler has no React or DOM dependency.
- [ ] Notebook is valid nbformat 4.5 with Python 3 metadata.
- [ ] Notebook cells have stable unique IDs, null execution counts, and empty outputs.
- [ ] Canonical config is UTF-8/Base64 embedded as inert data.
- [ ] Direct Notebook is independently executable without ZIP source imports.
- [ ] Notebook includes all 20 required sections from provenance through reproducibility notes.
- [ ] Generated custom program executes CSV loading.
- [ ] Generated custom program executes Parquet loading.
- [ ] Generated schema validation and aggregate schema summary work.
- [ ] Generated splits and integrity assertions work.
- [ ] Generated train-only preprocessing works.
- [ ] Generated causal features and next-step alignment work.
- [ ] All six classical model implementations execute for compatible tasks.
- [ ] All listed regression and classification metrics execute with documented semantics.
- [ ] Leaderboard, metrics.json, and run_manifest.json are exported.
- [ ] Deterministic synthetic data is labeled “SYNTHETIC EXAMPLE — NOT HEALTH DATA”.
- [ ] Generated task card, data-card template, README, and NOTICE are complete.
- [ ] Generated config and JSON schemas are complete.
- [ ] Generated requirements come from a fixed dependency registry.
- [ ] Windows PowerShell, shell, and headless launchers are static trusted templates.
- [ ] Complete ZIP uses one `diana-benchmark-program/` root.
- [ ] ZIP contains the exact required documentation, code, schemas, data, and results placeholders.
- [ ] Direct and ZIP Notebook bytes are identical.
- [ ] Manifest contains generator/task/component provenance and non-circular file hashes.
- [ ] ZIP entries are sorted, fixed-path, fixed-timestamp, deterministic, and bounded.
- [ ] Config, Notebook, and complete kit downloads work and revoke object URLs.
- [ ] Project slug is used only for sanitized external filenames.

## E. Hormonbench preset

- [ ] Preset identity/version/commit/dataset interval are verified from repository evidence.
- [ ] Timeline, targets, causal cutoff, feature families, folds, budgets, and metrics are exact.
- [ ] Exactly three classical baselines are shown.
- [ ] Diana-H3P is shown separately and honestly.
- [ ] Cold-start, K=3, K=7, and research-interval evidence match public artifacts.
- [ ] Locked scientific fields are visually and structurally immutable.
- [ ] Only verified runner-level settings are exposed.
- [ ] Official Notebook resolves repo/data roots without embedding local absolute paths.
- [ ] Official Notebook validates source files/commit/hashes where practical.
- [ ] Official Notebook invokes the real runner with static args, `shell=False`, and new output location.
- [ ] Official Notebook reads aggregate output and compares frozen public evidence.
- [ ] Official source, task card, benchmark card, data card, model card, and reproduction links work.

## F. Professional UI and routes

- [ ] Landing page implements product explanation and three entry modes.
- [ ] `/studio` provides the full compiler workspace.
- [ ] `/preset/hormonbench-mcphases-v1` provides preset and evidence.
- [ ] `/review` provides generated-program review/export.
- [ ] `/methodology` explains compiler, linter, validation, privacy, and provenance.
- [ ] `/about` explains Diana system hierarchy and Challenge positioning.
- [ ] A real Not Found route is implemented.
- [ ] Top command bar includes identity, mode, validation, fingerprint, reset/import/exports.
- [ ] Numbered left rail shows Data through Review with completion/error states.
- [ ] Center canvas uses aligned continuous research-workstation controls, not card soup.
- [ ] Right inspector has Protocol, Notebook, Files, and Manifest tabs.
- [ ] Bottom console shows Blocking, Scientific warnings, and Passed checks.
- [ ] Issues navigate to relevant configuration stages/fields.
- [ ] Numeric fields have real inputs and stepper buttons.
- [ ] Bounded sliders remain synchronized with numeric inputs.
- [ ] Segmented/select/combobox/token/checkbox/switch controls work.
- [ ] Editable model and metric tables enforce compatibility and limits.
- [ ] Notebook preview derives from generated Notebook object.
- [ ] File tree and manifest preview derive from generated program files.
- [ ] Deep ink, warm paper, mineral teal, precise typography, grid, and thin separators are applied.
- [ ] No analytics, tracking, third-party runtime scripts, remote fonts, or backend APIs are present.
- [ ] Visible privacy statement says programs are generated in-browser and run locally.
- [ ] Keyboard navigation, visible focus, semantic landmarks, and accessible names pass.
- [ ] Reduced motion and sufficient contrast are implemented.
- [ ] Layout has no horizontal overflow at 360×800, 768px, and 1440px.
- [ ] Charts have exact textual/table equivalents.

## G. Generation and security verification

- [ ] Schema/normalization/linter/compatibility TypeScript tests pass.
- [ ] Determinism and fingerprint-change tests pass.
- [ ] Import/export and injection-isolation tests pass.
- [ ] Quotes/newlines remain inert or are rejected.
- [ ] Python-, shell-, HTML/script-looking payloads remain inert or are rejected.
- [ ] Slash/backslash traversal, drive paths, NUL/control characters, and reserved names are rejected.
- [ ] Arbitrary code/import/package/template inputs are impossible.
- [ ] Notebook validates with nbformat.
- [ ] Notebook has no absolute private paths, secrets, dirty outputs, or duplicate cell IDs.
- [ ] ZIP round-trip verifies exact file set/root/order/hashes/no traversal/no duplicates.
- [ ] CSV single-target regression Notebook executes in a clean kernel.
- [ ] CSV multi-target regression Notebook executes in a clean kernel.
- [ ] Parquet regression Notebook executes through real pyarrow I/O.
- [ ] CSV binary classification Notebook executes.
- [ ] CSV multiclass classification Notebook executes.
- [ ] Grouped longitudinal next-step regression Notebook executes.
- [ ] Generated result metrics are finite or explicitly unavailable with a reason.
- [ ] Future-row mutation leaves past causal features unchanged.
- [ ] Target mutation leaves ordinary feature matrix unchanged.
- [ ] Validation/test mutation leaves fitted training preprocessing unchanged.
- [ ] Raw row shuffling is deterministic after stable sorting; duplicate group-time fails.
- [ ] Group assignments are invariant to target mutations and have zero overlap.
- [ ] Missing required columns fail clearly.

## H. Local quality, privacy, and frozen assets

- [ ] `npm ci --prefix diana-benchmark-studio` passes.
- [ ] `npm run lint --prefix diana-benchmark-studio` passes.
- [ ] `npm run typecheck --prefix diana-benchmark-studio` passes.
- [ ] `npm run test --prefix diana-benchmark-studio` passes.
- [ ] `npm run verify:notebooks --prefix diana-benchmark-studio` passes.
- [ ] `npm run build --prefix diana-benchmark-studio` passes with no production source maps.
- [ ] Existing `python -m pytest -q` passes.
- [ ] `git diff --check` passes.
- [ ] Release/privacy allow-list admits tracked Studio source only.
- [ ] Generated ZIPs, Notebooks, dist, node_modules, `.vercel`, data, source maps, and executions are ignored.
- [ ] Before/after `results/v1` SHA-256 inventory is identical.
- [ ] Dataset/private ignore rules remain intact.

## I. Browser and deployment QA

- [ ] Local dev server passes agent-browser load/content/overlay/console checks.
- [ ] Every route and direct refresh works under SPA fallback.
- [ ] Browser back/forward and Not Found work.
- [ ] Preset, fork, linter leakage demo, controls, previews, and exports work in-browser.
- [ ] Actual browser-downloaded Notebook validates and executes.
- [ ] Actual browser-downloaded ZIP extracts and passes manifest/identity checks.
- [ ] Offline/browser-local generation boundary is verified by network inspection.
- [ ] Preview deployment is READY in a new `diana-benchmark-studio` Vercel project.
- [ ] Preview passes functional, responsive, accessibility, console, MIME, and security-header QA.
- [ ] The exact verified artifact is promoted/deployed to Production.
- [ ] Production URL and all deep routes pass QA.
- [ ] Production downloads revalidate successfully.
- [ ] Vercel project/deployment IDs and build metadata are recorded.
- [ ] Existing `diana-rust` Donation App project remains unchanged.

## J. Documentation and final gate

- [ ] Studio README, architecture, generation contract, linter, privacy, and demo-flow docs are complete.
- [ ] Root README reflects Donation App → Studio → Hormonbench → H3P hierarchy.
- [ ] Challenge narrative positions Diana primarily as Layer 03 Application Infrastructure.
- [ ] Demo script covers all 13 required Challenge moments.
- [ ] IMPLEMENTATION_CHECKLIST is reviewed and every checked item has evidence.
- [ ] No new implementation file exists outside `diana-benchmark-studio/` except permitted surgical docs/privacy edits.
- [ ] No commit or push occurred.
