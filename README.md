<p align="center">
  <img src="frontend/public/assets/diana-logo-transparent.svg" alt="DIANA logo" width="150" />
</p>

<h1 align="center">DIANA</h1>

<p align="center">
  <strong>From responsible contribution to reproducible evidence in women's hormonal health.</strong>
</p>

<p align="center">
  A governance-aware research infrastructure connecting participant-controlled data contribution,
  executable benchmark design, and leakage-resistant model evaluation.
</p>

<p align="center">
  <a href="#why-diana">Why DIANA</a> ·
  <a href="#the-diana-system">System</a> ·
  <a href="#benchmark-infrastructure">Benchmark</a> ·
  <a href="#diana-h3p">Model</a> ·
  <a href="#donation-app">Application</a> ·
  <a href="#quick-start">Quick start</a>
</p>

<p align="center">
  <img src="figures/README%20(1).png" alt="DIANA — from responsible contribution to reproducible evidence" width="100%" />
</p>

---

## Why DIANA

Hormonal-health research is often limited by three problems that are treated separately:

1. **Data contribution is difficult to understand and control.** Participants rarely see a clear connection between permission, data categories, research projects, and withdrawal.
2. **Experimental protocols are difficult to reproduce.** Small changes in time cutoffs, participant splits, preprocessing, or metrics can silently invalidate a comparison.
3. **Longitudinal models are easy to overestimate.** Random row splits, future information, participant identity, and unequal scoring can create performance that does not generalize to a new participant.

DIANA addresses these problems as one research lifecycle. It connects clearer participant permission to executable scientific protocols, then evaluates models behind a governed-data boundary and releases only aggregate evidence.

> **DIANA is not simply a web app plus a model. It is a set of contracts connecting permission, protocol, prediction, and release.**

## The DIANA system

| Layer | What DIANA provides | Why it matters |
|---|---|---|
| **Contribution** | A participant and researcher web experience for project discovery, granular permission, aggregate feasibility, and future withdrawal | Makes the path from contribution to research visible and participant-centered |
| **Benchmark** | Diana Benchmark Studio and the frozen Hormonbench-mcPHASES v1 protocol | Converts methodological decisions into executable, comparable experiments |
| **Model** | Diana-H3P, a compact budget-aware tri-hormone reference model | Demonstrates cold-start prediction, K=0/3/7 personalization, and calibrated research uncertainty |

<p align="center">
  <img src="figures/README%20(4).png" alt="DIANA system overview" width="100%" />
</p>

### At a glance

| | |
|---|---:|
| Eligible participants in Hormonbench v1 | **20** |
| Eligible next-day forecast origins | **1,509** |
| Causal history window | **14 days** |
| Wearable candidate features | **490** |
| Participant-disjoint outer folds | **5** |
| Personal measurement budgets | **K = 0, 3, 7** |
| Forecast targets | **LH, E3G, PdG** |
| H3P empirical interval coverage | **0.781–0.796** for nominal 80% intervals |

---

## Benchmark infrastructure

DIANA's primary reusable technical contribution is its benchmark infrastructure: a general visual benchmark compiler paired with an implementation-validated hormonal-health benchmark.

### Diana Benchmark Studio

Diana Benchmark Studio lets a researcher define a benchmark through a visual workflow and export an experiment that runs locally with governed data.

The Studio compiles:

```text
Research configuration
        ↓
Typed TaskSpec
        ↓
Scientific lint and schema validation
        ↓
Normalized protocol + SHA-256 fingerprint
        ↓
Executable Notebook + Benchmark Kit
```

The scientific linter checks the choices that most often make longitudinal evaluation unreliable:

- participant overlap between training and evaluation;
- future information crossing the forecast cutoff;
- target or identifier leakage into model features;
- preprocessing fitted outside the training partition;
- incompatible task, model, and metric combinations;
- ambiguous hormone source and label provenance;
- incomparable personalization budgets.

The output is more than a notebook. A Benchmark Kit can include the canonical task specification, schemas, task and data-card templates, deterministic example data, runner scripts, dependency information, a manifest, and file hashes. Real data remains on the researcher's machine.

### Hormonbench-mcPHASES v1

Hormonbench is DIANA's first frozen scientific preset. It is built on the governed [mcPHASES 1.0.0](https://physionet.org/content/mcphases/1.0.0/) dataset and asks a precise question:

> Given 14 causal calendar days of wearable summaries, can a model forecast the next genuinely observed urinary LH, E3G, and PdG readings for a participant it has not trained on?

#### Frozen task contract

| Contract | Hormonbench v1 |
|---|---|
| Task ID | `hormonbench_mcphases_interval2_nextday_v1` |
| Inputs | Wearable summaries from `t−13` through `t` |
| Targets | Genuinely observed urinary LH, E3G, and PdG at `t+1` |
| Split | Five deterministic participant-disjoint outer folds |
| Cold start | No personal hormone labels from held-out participants |
| Personalization | Earliest K=0, K=3, or K=7 complete readings only |
| K comparison | One identical post-seventh-measurement scoring cohort |
| Primary metric | Participant-macro, hormone-balanced normalized `log1p` MAE |
| Public release | Aggregate results, protocol documents, manifests, and hashes |

The `t+1` horizon is deliberate. At-home urinary measurements do not provide a sufficiently reliable within-day timestamp for same-day wearable summaries. Forecasting the following day creates a defensible information cutoff.

#### Leakage resistance by design

Hormonbench excludes participant and sample identifiers, absolute study time, hormone history, target-derived phase labels, future values, centered windows, backward filling, and future interpolation. Preprocessing is fitted on training participants only.

Models receive feature-only views. Held-out truth is joined only inside an independent evaluator, which verifies task identity, hashes, fold and track metadata, exact sample coverage, finite nonnegative predictions, interval ordering, and the absence of truth columns.

This is the central idea behind Hormonbench: **comparability is enforced by the protocol and evaluator, rather than requested in prose.**

---

## Diana-H3P

**Diana-H3P — Budget-Aware Hierarchical Tri-Hormone Personalizer** — is a compact statistical reference model designed for the small-cohort, repeated-measurement setting of Hormonbench.

### Layer 1: participant-independent wearable prior

For each hormone, H3P learns a participant-balanced convex stack of three complementary experts:

- population median;
- wearable Ridge regression;
- CatBoost.

The nonnegative weights sum to one and are learned from participant-grouped out-of-fold predictions on development participants.

### Layer 2: budget-aware joint personalization

H3P then models the remaining `[LH, E3G, PdG]` residuals jointly. With zero, three, or seven authorized personal readings, it updates a participant-specific three-hormone offset using shrinkage-stabilized covariance estimates.

At `K=0`, Layer 2 applies no personal offset and exactly returns the Layer-1 prior. At `K=3` and `K=7`, only the earliest chronological calibration readings are available, and those readings are excluded from scoring.

The model also emits participant-block calibrated **80% research prediction intervals**. Across hormones and budgets, empirical coverage ranges from **0.781 to 0.796**.

### Results

Lower overall score is better. All K budgets below use the same 1,369-origin scoring suffix.

| Budget | Strongest comparator | Comparator score | Diana-H3P | Difference |
|---:|---|---:|---:|---:|
| K=0 | Population median | **0.633978** | 0.642250 | +1.30% |
| K=3 | Population median | **0.610852** | 0.616188 | +0.87% |
| K=7 | CatBoost | **0.607195** | 0.608918 | **+0.28%** |

At K=7, H3P comes within **0.28%** of the strongest overall comparator while improving the LH and E3G components relative to CatBoost and adding joint personalization plus calibrated uncertainty. The result is useful precisely because Hormonbench makes the trade-off visible: a richer model can offer better structure and uncertainty without hiding behind an unsupported overall-superiority claim.

Full aggregate results are available in [`results/v1/diana_h3p/RESULTS.md`](results/v1/diana_h3p/RESULTS.md), with the implementation contract in [`model/diana_h3p/MODEL_CARD.md`](model/diana_h3p/MODEL_CARD.md).

---

## Donation App

The DIANA Donation App demonstrates how a participant-centered contribution layer can connect to the research lifecycle.

### Participant journey

- discover approved research projects;
- choose specific data categories or a specific project;
- distinguish retrospective and prospective permission;
- review how contributed categories match research needs;
- update preferences or withdraw future access.

### Researcher journey

- define a project, target population, requested data categories, follow-up, and collection timing;
- review aggregate feasibility and missing requirements;
- explore project readiness without exposing participant-level records;
- export a synthetic aggregate availability manifest for the demonstrated workflow.

The application uses React, TypeScript, Vite, Tailwind CSS, and Radix UI on the frontend, with FastAPI and signed HTTP-only sessions on the backend. The current experience is a high-fidelity interactive research-infrastructure prototype using synthetic records; its purpose is to demonstrate consent-aware product logic without exposing real health data.

---

## Privacy and governance boundary

DIANA keeps governed data and public evidence deliberately separate.

| Remains local/private | Safe public surface |
|---|---|
| mcPHASES participant rows | Aggregate benchmark scores |
| Participant and sample identifiers | Aggregate figures |
| Fold mappings and held-out truth | Task, benchmark, data, and model cards |
| Calibration mappings and row-level predictions | Run metadata and package versions |
| Participant-level metrics and fitted private artifacts | Manifests and cryptographic file hashes |

The public repository does not redistribute mcPHASES. Researchers obtain the dataset directly from PhysioNet under its data-use agreement and execute the benchmark locally.

---

## Repository structure

```text
Diana/
├── benchmark/          # Hormonbench adapters, contracts, evaluator, metrics, privacy checks
├── model/              # Baselines and Diana-H3P
├── configs/            # Frozen benchmark and model configurations
├── scripts/            # Reproduction and audit entry points
├── results/            # Public aggregate results and figures
├── frontend/           # Participant and researcher web application
├── backend/            # FastAPI session API and production SPA host
├── docs/               # Challenge narrative, demo, and release documentation
└── reports/            # Scientific audit and implementation records
```

## Quick start

### Run the web application locally

Requirements: Node.js 22+, npm 10+, Python 3.11+, and [`uv`](https://docs.astral.sh/uv/).

```bash
npm ci --prefix frontend
uv sync --project backend --frozen
```

Start the backend:

```bash
make api
```

In a second terminal, start the frontend:

```bash
make web
```

Open the Vite URL shown in the terminal, normally `http://127.0.0.1:5173`.

### Production-style local run

```bash
npm run build --prefix frontend
uv run --project backend uvicorn backend.src.main:app --host 0.0.0.0 --port 8000
```

### Run Diana-H3P without governed data

The synthetic path validates the H3P input/output contract without accessing mcPHASES:

```bash
uv sync --extra test
uv run python scripts/run_diana_h3p_v1.py --synthetic
```

### Prepare Hormonbench with authorized mcPHASES access

After obtaining mcPHASES 1.0.0 and configuring `paths.data_root`:

```bash
uv run python -m benchmark prepare --config configs/hormonbench_v0.yaml
uv run python -m benchmark prepare --config configs/hormonbench_v1.yaml
```

See [`benchmark/docs/DATA_ACCESS.md`](benchmark/docs/DATA_ACCESS.md) for the governed-data workflow.

### Validate the public implementation

```bash
npm run lint --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
uv run python scripts/run_diana_h3p_v1.py --synthetic
```

---

## Scope and responsible use

DIANA is reusable **research infrastructure**, not a clinical product. It does not diagnose disease, recommend treatment, infer serum hormone concentrations, verify ovulation, or provide medical decision support. The benchmark targets are participant-entered at-home urinary monitor readings, and all reported results are descriptive research-benchmark results on a small governed cohort.

Within this README, *causal* means **cutoff-respecting and leakage-controlled**. It does not claim causal-effect identification or physiological causal inference.

## Documentation

| Document | Purpose |
|---|---|
| [`benchmark/README.md`](benchmark/README.md) | Benchmark package and execution guide |
| [`benchmark/docs/TASK_CARD_V1.md`](benchmark/docs/TASK_CARD_V1.md) | Frozen prediction task and track rules |
| [`benchmark/docs/BENCHMARK_CARD_V1.md`](benchmark/docs/BENCHMARK_CARD_V1.md) | Evaluation design, caveats, and leakage controls |
| [`benchmark/docs/DATA_CARD.md`](benchmark/docs/DATA_CARD.md) | Data provenance, targets, and source limitations |
| [`benchmark/docs/DATA_ACCESS.md`](benchmark/docs/DATA_ACCESS.md) | Governed-data access and nonredistribution boundary |
| [`model/diana_h3p/MODEL_CARD.md`](model/diana_h3p/MODEL_CARD.md) | H3P architecture, uncertainty, and results |
| [`results/v1/diana_h3p/RESULTS.md`](results/v1/diana_h3p/RESULTS.md) | Canonical aggregate leaderboard |
| [`docs/RELEASE_SAFETY.md`](docs/RELEASE_SAFETY.md) | Release privacy procedure |

## License

DIANA's original code and documentation are released under the [MIT License](LICENSE). This license does not redistribute mcPHASES or override PhysioNet and third-party terms.

---

<p align="center">
  <strong>DIANA connects responsible contribution to comparable, reproducible evidence.</strong>
</p>
