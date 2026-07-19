<p align="center">
  <img src="frontend/public/assets/diana-logo-transparent.svg" alt="DIANA logo" width="144" />
</p>

<h1 align="center">DIANA</h1>

<p align="center">
  Consent-aware women's hormonal health research infrastructure, combining a governed-data benchmark with a synthetic participant and researcher web prototype.
</p>

---

# Introduction

DIANA is a Hack-Nation research-infrastructure repository for women's hormonal health. It contains two complementary but currently separate systems:

| System | Status | Purpose |
|---|---|---|
| Hormonbench v1 | Active scientific benchmark | Defines a governed, participant-disjoint next-day hormone forecasting benchmark over locally held mcPHASES data. |
| Diana-H3P | Active reference model, post-hoc | Demonstrates stacked wearable priors, few-shot personalization, and research prediction intervals on Hormonbench. |
| Consent web prototype | Synthetic UX prototype | Demonstrates public project discovery, participant consent management, and researcher aggregate feasibility workflows. |

The repository is designed as reusable infrastructure, not as a clinical product. DIANA does not provide diagnoses, treatment recommendations, verified ovulation prediction, serum-hormone inference, or medical decision support. When this README uses the word `causal`, it means cutoff-respecting and leakage-controlled: features are restricted to information available by the forecast cutoff. It does not mean causal-effect estimation or physiological causal inference.

The web prototype does not process real participant records. It uses synthetic catalog data and browser-local state to demonstrate application flows. The benchmark results were generated from locally held licensed mcPHASES data, but the governed dataset, participant rows, identifiers, private model artifacts, row-level predictions, calibration mappings, and participant-level metrics are not redistributed.

## Repository Status

| Component | Current interpretation |
|---|---|
| `benchmark/` | Active benchmark package for preparation contracts, folds, scoring, reports, and privacy checks. |
| `model/` | Active model package for baselines and Diana-H3P. |
| `model/diana_h3p/` | Active reference implementation for Budget-Aware Hierarchical Tri-Hormone Personalization. |
| `results/v1/diana_h3p/` | Active aggregate result surface. |
| `model/joint_bayes_personalizer/` | Historical comparator only. Its global fold-0 covariance choice crossed later outer-test roles, so it is protocol-compromised. |
| `results/v1/historical_protocol_compromised_comparator/` | Preserved historical record, not an active leaderboard. |
| `results/v0/` | Superseded v0 record. v0 used stale cross-interval menstrual-calendar state and should not be cited as current performance. |
| `frontend/` and `backend/` | Synthetic consent-based web application prototype. |

## Quick Architecture View

```text
Licensed mcPHASES data, held locally only
        |
        v
benchmark/data adapters
        |
        v
Private prepared bundle
rows, truth, folds, IDs, calibration views
artifacts/private/v1/...  (ignored)
        |
        +-------------------------------+
        |                               |
        v                               v
Feature-only model views          Private evaluator
        |                          truth joins and metrics
        v                               ^
Classical baselines                    |
population_median, ridge, catboost     |
        |                               |
        v                               |
Diana-H3P Layer 1                      |
participant-balanced stack             |
        |                               |
        v                               |
Diana-H3P Layer 2                      |
K=0/3/7 personalization and intervals  |
        |                               |
        v                               |
Prediction CSV manifest with hashes ---+
        |
        v
Aggregate public results and privacy checks
```

The web prototype is separate from the benchmark path. It uses React and FastAPI to demonstrate consent and feasibility journeys, but it does not read `artifacts/private/`, `dataset/`, or real health data.

---

# Technical Documentation

## Glossary

| Term | Definition in this repository |
|---|---|
| Participant-origin | One forecasting case for one participant at an origin day `t`. |
| History window | The 14 calendar days `t-13` through `t` used to build features. |
| Cutoff | The end of origin day `t`. Information after this point is forbidden. |
| Forecast horizon | The target day. Hormonbench v1 predicts `t+1`. |
| Genuinely observed label | A recorded hormone measurement, not an interpolated, forward-filled, inferred, or imputed target. |
| LH | Luteinizing hormone, from participant-entered at-home urinary monitor readings. |
| E3G | Estrone-3-glucuronide, sourced from the mcPHASES `estrogen` column. It is urinary, not serum estradiol. |
| PdG | Pregnanediol-glucuronide, urinary metabolite, not serum progesterone. |
| `log1p(y)` | `ln(1 + y)`. It compresses nonnegative skewed values and is defined at zero. |
| Participant-disjoint | A participant cannot be split across train, validation, and test roles in the same fold. |
| Cold start | Forecasting held-out participants without personal hormone calibration labels. |
| Few shot | Forecasting after only the earliest K complete personal hormone readings are authorized. K is 0, 3, or 7. |
| Calibration row | A personal target row disclosed to a personalization method. Calibration rows are excluded from scoring. |
| Common suffix | The identical later scoring set used for all few-shot K budgets, so K comparisons are not caused by different rows. |
| OOF prediction | Out-of-fold prediction generated by a model that did not train on the held-out participant group. |
| Participant-macro metric | Error is averaged inside each participant first, then participants are averaged equally. |
| IQR | Interquartile range, `Q75 - Q25`, used as a robust development-set scale. |
| Covariance shrinkage | Regularizing a covariance matrix toward a simpler target to reduce instability in small samples. |
| Prediction interval | A model-produced range for a future observation. Here it is a research uncertainty output, not a clinical confidence interval. |
| Manifest | A JSON inventory binding files, hashes, folds, configuration, and run metadata. |
| SHA-256 | A content hash used to detect changed artifacts. It does not anonymize private records. |

## Root Repository Layout

```text
repository/
├── benchmark/              # Hormonbench task contracts, adapters, evaluator, reports, privacy checks
├── model/                  # Baselines, historical comparator, Diana-H3P, model tests
├── configs/                # Benchmark and H3P YAML configurations
├── scripts/                # Reproduction and audit runners
├── reports/                # Phase 0 audit and Phase 1 protocol/specification records
├── results/                # Public aggregate benchmark outputs and figures
├── frontend/               # React/Vite consent-based prototype
├── backend/                # FastAPI session API and production SPA host
├── Dockerfile.vercel       # Multi-stage frontend build plus FastAPI runtime image
├── Makefile                # Local web development helpers
├── pyproject.toml          # Root benchmark/model Python project
├── LICENSE                 # MIT license for DIANA code/docs with data exclusions
└── README.md               # This technical entry point
```

Important ignored local directories and files:

| Path | Reason |
|---|---|
| `dataset/` | Governed mcPHASES data, never redistributed. |
| `artifacts/private/` | Prepared rows, folds, truth, predictions, fitted parameters, and participant metrics. |
| `frontend/node_modules/` | Installed npm dependencies. |
| `frontend/dist/` | Generated production frontend build. |
| `.venv/`, `backend/.venv/` | Local Python environments. |
| `.env`, `backend/.session-secret` | Runtime secrets and local configuration. |

## Scientific Benchmark: Hormonbench v1

Hormonbench v1 is the active scientific benchmark. Its task ID is `hormonbench_mcphases_interval2_nextday_v1` and its version is `1.0.0`.

The task uses Interval 2 (`study_interval == 2024`) from mcPHASES 1.0.0. For each eligible origin day `t`, it constructs features from exactly 14 calendar days, `t-13` through `t`, and predicts the genuinely observed urinary LH, E3G, and PdG readings at `t+1` in `log1p` space.

Eligibility rules:

| Requirement | Meaning |
|---|---|
| Complete calendar history | The target table must contain each day from `t-13` through `t`. |
| Next-day row | The target table must contain day `t+1`. |
| Complete target vector | LH, E3G, and PdG must all be observed at `t+1`. |
| Interval restriction | Only Interval 2 is used. |
| Wearable missingness allowed | Missing wearable values do not disqualify an origin; missingness becomes part of the feature representation. |

Frozen v1 cohort and fold structure:

| Quantity | Value |
|---|---:|
| Eligible participants | 20 |
| Eligible origins | 1,509 |
| Outer folds | 5 |
| Participants per group | 4 |
| Per-fold starting roles | 12 train / 4 validation / 4 test |
| Final model development set | 16 train-plus-validation participants |
| Cold-start scoring rows | 1,509 origins |
| Few-shot common suffix rows | 1,369 origins |
| Few-shot budgets | K=0, K=3, K=7 |

The v1 feature contract intentionally removes v0 menstrual-calendar and self-report features. v0 carried a stale Interval-1 menstrual onset into Interval 2, creating a 773 to 932 day old timing field that correlated with absolute origin time. v1 also excludes absolute time, participant identifiers, target history, future values, backfilled values, interpolated fields, Mira/fertility fields, and structurally absent self-reports.

Approved v1 daily signal families:

| Family | Examples |
|---|---|
| Active minutes | Sedentary, light, moderate, vigorous minutes. |
| Computed temperature | Temperature summaries aligned to sleep end day. |
| Heart-rate variability | RMSSD, frequency-domain summaries, coverage, record count. |
| Respiratory summaries | Sleep-stage breathing-rate summaries. |
| Sleep score | Sleep duration/quality and resting-heart-rate summaries. |
| Weekend state | Calendar weekend indicator available at cutoff. |

Each daily signal emits causal summary features such as last value, mean, standard deviation, minimum, maximum, slope, coverage, time since last observation, current-day missingness, and lags 0, 1, 3, 6, and 13. The result is 490 candidate v1 features before fit-only filtering.

## Evaluator and Metrics

The benchmark evaluator is model-independent and imports no model code. Models submit prediction CSV files in a strict schema. The evaluator validates file hashes, task identity, fold, track, calibration budget, nonnegative finite predictions, prediction interval ordering, exact sample coverage, and absence of truth columns.

Primary point metric:

| Step | Description |
|---|---|
| 1 | Compute absolute `log1p` error for each scored participant-origin and hormone. |
| 2 | Average errors within each participant and hormone. |
| 3 | Divide by the fold's participant-balanced development IQR for that hormone. |
| 4 | Average participants equally. |
| 5 | Average LH, E3G, and PdG. Lower is better. |

Secondary metrics include per-hormone `log1p` MAE, raw-unit MAE, RMSE, model skill relative to population median, participant-improvement counts, fold-level descriptive dispersion, interval coverage, interval width, and interval score.

The five folds are not five independent random experiments. They are deterministic participant-role rotations with overlapping development sets and heavily overlapping 14-day windows, so fold standard deviations are descriptive rather than formal confidence intervals.

## Active Baselines

| Model | Technical definition |
|---|---|
| `population_median` | For each hormone, compute each development participant's median target, then take the median of participant medians. Emits that scalar for all test rows. |
| `wearable_ridge` | One Ridge regression per hormone using approved wearable features, train-only filtering, median imputation, participant-balanced weighting, weighted standardization, fixed alpha, and nonnegative clipping. |
| `catboost` | One CPU CatBoost regressor per hormone. Tree count is selected on train/validation participants, then the model is refit on all 16 development participants. |

Classical baselines use a standard few-shot residual-offset adapter at K=3 and K=7. It estimates per-hormone between-participant and within-participant residual variance from development OOF predictions, then applies a shrinkage-weighted personal residual offset from the authorized calibration rows. K=0 applies no offset.

## Diana-H3P Reference Model

Diana-H3P means Budget-Aware Hierarchical Tri-Hormone Personalizer. It is a reference model showing how the benchmark supports cold-start predictions, measurement-budget personalization, joint tri-hormone residual modeling, and research intervals.

Diana-H3P is not an untouched-test superiority claim. It was designed after earlier v1 outer-test results had been inspected. Its value is as a transparent, audited reference implementation, not as evidence that H3P is clinically or statistically superior.

Layer 1, participant-independent stacked prior:

| Mechanism | Description |
|---|---|
| Expert inputs | Population median, wearable Ridge, and CatBoost. |
| Stack form | Nonnegative convex weights that sum to one. |
| Search | 0.10-step simplex grid, selected separately per hormone. |
| Objective | Participant-macro OOF `log1p` MAE on development participants. |
| Leakage control | Fresh participant-grouped OOF predictions; CatBoost stopping is nested inside OOF blocks. |

Layer 2, hierarchical tri-hormone personalization:

| Quantity | Description |
|---|---|
| Residual vector | Observed `[LH, E3G, PdG]` minus Layer-1 prior predictions. |
| `Sigma_a` | Persistent participant-offset covariance estimated from development participant residual means. |
| `Psi_3` and `Psi_7` | Calibration-mean error covariance for the exact chronological K=3 and K=7 protocols. |
| `Sigma_future` | Future residual variation around participant offsets. |
| Shrinkage | Continuous Ledoit-Wolf style correlation shrinkage with eigenvalue flooring. |
| Posterior update | Empirical-Bayes update of a participant-specific three-hormone offset using authorized calibration residuals. |
| K=0 behavior | Exactly returns the Layer-1 prior with zero personal offset. |

Uncertainty behavior:

| Item | Meaning |
|---|---|
| Target level | 80% research prediction intervals. |
| Calibration method | Participant-block leave-one-participant-out calibration on development participants. |
| Bounds | Point prediction plus/minus a calibrated multiplier times posterior predictive standard deviation; lower bound is clamped at zero. |
| Limitation | These are not clinical confidence intervals and do not provide standard IID conformal guarantees. |

NumPy float64 is the canonical Layer-2 backend. Optional PyTorch CPU and CUDA paths exist for parity/profiling, but the recorded small 3 by 3 workload was faster and lighter with NumPy.

## Canonical Active Results

Lower overall normalized score is better.

Cold-start leaderboard over 20 participants and 1,509 origins:

| Model | Overall | LH log-MAE | E3G log-MAE | PdG log-MAE | Participants improved vs median |
|---|---:|---:|---:|---:|---:|
| Population median | **0.636527** | 0.439421 | 0.431112 | 0.669523 | 0/20 |
| Diana-H3P | 0.644181 | 0.449617 | 0.432165 | 0.674558 | 10/20 |
| CatBoost | 0.651631 | 0.452675 | 0.439782 | 0.681653 | 7/20 |
| Wearable Ridge | 0.824231 | 0.585284 | 0.544308 | 0.866884 | 1/20 |

Measurement-budget results:

| Track and budget | Winning model | Winning score | H3P score | Interpretation |
|---|---|---:|---:|---|
| Cold start | Population median | **0.636527** | 0.644181 | H3P did not beat the median. |
| Common suffix K=0 | Population median | **0.633978** | 0.642250 | Same few-shot suffix, no calibration. |
| K=3 | Population median | **0.610852** | 0.616188 | Three readings improved H3P but not enough to win. |
| K=7 | CatBoost | **0.607195** | 0.608918 | H3P improved LH/E3G vs CatBoost but worsened PdG. |

H3P therefore did not beat the strongest comparator at any official budget. The result should be read as honest negative/descriptive evidence and as a reproducible reference pipeline.

See [`results/v1/diana_h3p/RESULTS.md`](results/v1/diana_h3p/RESULTS.md) for the full aggregate report.

## Data, Privacy, and Licensing Boundary

DIANA code and project documentation are MIT licensed. mcPHASES and third-party data/materials are excluded and retain their own terms. Obtain mcPHASES 1.0.0 directly from PhysioNet under its data-use agreement before attempting real-data reproduction.

Public artifacts may contain:

| Public artifact type | Example |
|---|---|
| Aggregate metrics | Leaderboards, fold summaries, skill values. |
| Aggregate figures | SVG result plots. |
| Run metadata | Package versions, hashes, runtime, hardware summary. |
| Protocol documentation | Task cards, benchmark cards, model cards, release notes. |

Private artifacts must not be published:

| Private artifact type | Reason |
|---|---|
| mcPHASES rows | Governed participant data. |
| Participant IDs and sample IDs | Re-identification and linkage risk. |
| Prepared bundles and folds | Contain truth, IDs, and row alignment. |
| Calibration mappings | Contain participant-specific authorized truth. |
| Row-level predictions | Linkable to sample IDs and truth joins. |
| Fitted private parameters | Derived from governed rows and calibration structure. |
| Participant-level metrics | Participant-specific performance information. |

The release/privacy tooling scans for forbidden files, private paths, ID/truth columns, archives, caches, and public result leaks. Its benchmark allow-list predates the later web prototype, so treat it as benchmark-release tooling unless it is updated for the full repository.

## Reproducibility Notes

Self-contained commands can validate parts of the implementation, especially the synthetic H3P path and web build. Full real-data scientific reproduction requires the governed mcPHASES dataset and private intermediate artifacts that are intentionally not in the repository.

Important constraints:

| Constraint | Practical effect |
|---|---|
| No public mcPHASES rows | Real benchmark preparation cannot run from a fresh public clone alone. |
| No `artifacts/private/` | Canonical H3P cannot be replayed byte-for-byte without private prepared bundles, baseline prediction manifests, and fitted artifacts. |
| No root `uv.lock` | Root benchmark/model dependencies are pinned directly but transitive packages are not frozen by a root lockfile. |
| Post-hoc H3P | H3P is an audited reference after prior v1 result inspection, not an untouched-test confirmation. |
| Historical dirty-tree record | The canonical manifest records code and hash provenance, including known reproducibility caveats. |

Use [`benchmark/docs/DATA_ACCESS.md`](benchmark/docs/DATA_ACCESS.md), [`benchmark/docs/TASK_CARD_V1.md`](benchmark/docs/TASK_CARD_V1.md), [`benchmark/docs/BENCHMARK_CARD_V1.md`](benchmark/docs/BENCHMARK_CARD_V1.md), and [`model/diana_h3p/MODEL_CARD.md`](model/diana_h3p/MODEL_CARD.md) for deeper scientific protocol details.

## Web Prototype Architecture

The web application demonstrates how future DIANA infrastructure could support public project discovery, participant permission choices, and researcher aggregate feasibility review. It is a prototype, not a production consent, identity, ethics, data-access, or medical-record system.

Frontend stack:

| Tool | Use |
|---|---|
| React 19 | Single-page application and component model. |
| TypeScript | Static typing for UI and domain state. |
| Vite | Development server and production bundling. |
| React Router | Public, participant, and scientist route flows. |
| Tailwind CSS 4 | Design system and responsive layout. |
| Radix UI | Dialog and accordion accessibility primitives. |
| Zod | Runtime validation for persisted state and auth responses. |
| Lucide | Icons. |
| Remotion | Synthetic project explainer video composition and MP4 rendering. |

Backend stack:

| Tool | Use |
|---|---|
| FastAPI | Health endpoint, auth session API, and production SPA host. |
| Starlette session middleware | Signed HTTP-only cookie session. |
| pydantic-settings | Environment-variable and `.env` configuration. |
| Uvicorn | ASGI server. |
| uv | Python dependency/environment manager. |

Current backend scope:

| Capability | Status |
|---|---|
| Health endpoint | Implemented. |
| Prototype login/session/logout | Implemented with signed cookies. |
| Production SPA serving | Implemented. |
| Database | Not implemented. |
| SQLAlchemy models | Not implemented. |
| Persistent users | Not implemented. |
| Real consent records | Not implemented. |
| Data ingestion or de-identification API | Not implemented. |
| Research access approval workflow | Not implemented. |
| Cron/background jobs | Not implemented. |

## Frontend Routes

| Route | Audience | Description |
|---|---|---|
| `/` | Public | Landing page and calls to donate data or explore research. |
| `/tree` | Public | Technical Hormonbench/model flow visualization. |
| `/projects` | Public | Synthetic approved project catalog. |
| `/projects/:projectId` | Public | Project details and participant contribution CTA. |
| `/participant/login` | Participant | Prototype participant sign-in. |
| `/participant/contribution-choice` | Participant | Choose category-based or project-specific contribution. |
| `/participant/data-types` | Participant | Review supported synthetic data categories. |
| `/participant/project/:projectId/contribute` | Participant | Select requested categories for a project. |
| `/participant/consent/:dataType` | Participant | Simulated consent and DocuSeal-style signing flow. |
| `/participant/dashboard` | Participant | Review active permissions, matching projects, and withdrawals. |
| `/scientist/login` | Researcher | Prototype researcher sign-in and local access-request message. |
| `/scientist/terms` | Researcher | Required local-use confirmations. |
| `/scientist/dashboard` | Researcher | Aggregate feasibility, project creation, and synthetic CSV download. |

## Backend API

| Method | Path | Request | Response | Behavior |
|---|---|---|---|---|
| `GET` | `/api/health` | None | `{status, frontend_built}` | Reports backend liveness and whether `frontend/dist/index.html` exists. |
| `POST` | `/api/auth/login` | `{role, username, password}` | `{role, username}` | Accepts any non-empty username/password and stores role/username in a signed session cookie. |
| `GET` | `/api/auth/session` | Cookie | `{role, username}` | Returns the current signed session or `401` if absent/invalid. |
| `POST` | `/api/auth/logout` | Cookie optional | `204 No Content` | Clears the browser session cookie. |

Unknown `GET /api/...` paths return JSON `404` instead of falling through to the SPA. Non-API paths are served from the Vite build in production. If the frontend build is missing, non-API routes return `503` with a build instruction.

## Prototype State and Data Model

The frontend stores synthetic interactive state in `localStorage` under `diana.prototype.v1`. This includes authentication booleans, researcher terms acceptance, contribution intent, consent records, contributed category IDs, researcher-created projects, and the selected researcher project.

Important prototype limitations:

| Limitation | Meaning |
|---|---|
| Browser-local state | Data is not persisted to a server or scoped to a real user account. |
| Cross-username persistence | A second username in the same browser can inherit prior synthetic consent/project state. |
| Simulated consent | Typed names and dates are local prototype fields, not legal signatures. |
| Simulated DocuSeal | The flow uses timers and text; no document is sent to DocuSeal. |
| Synthetic feasibility | Completeness, matching participants, and data points are fixture-derived estimates. |
| Aggregate CSV only | Researcher download is a synthetic availability manifest, not participant-level data. |
| Withdrawal is local | Withdrawal changes future simulated matching only; it is not a real data-deletion or governance workflow. |

## Backend Configuration

Settings are defined in `backend/src/envs.py`. The sample file is `backend/src/.env.sample`, but the app loads `.env` relative to the process working directory. For the commands in this README, place local `.env` values at the repository root or export variables in your shell.

| Variable | Default | Description |
|---|---|---|
| `DIANA_APP_NAME` | `DIANA prototype` | FastAPI application title. |
| `DIANA_DEPLOYMENT` | `local` | Deployment label. `preview` and `production` enable secure cookies automatically. |
| `VERCEL_ENV` | None | Alternative source for deployment when present. |
| `DIANA_FRONTEND_DIST` | `frontend/dist` | Production frontend build directory. Relative paths depend on the current working directory. |
| `DIANA_SECURE_COOKIES` | `false` | Forces the session cookie `Secure` flag when true. |
| `DIANA_SESSION_MAX_AGE` | `28800` | Signed-cookie lifetime in seconds. |
| `DIANA_SESSION_SECRET` | Local fallback or generated image secret | Secret key used to sign session cookies. Set a long random value for shared or public deployments. |

Generate a local secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

The session cookie is signed but not encrypted. The browser cannot safely modify it without the secret, but its role and username payload are not confidential against the cookie holder. This is prototype session gating, not production authentication, registration, authorization, rate limiting, CSRF protection, or identity verification.

---

# Get Started

## Requirements

| Requirement | Recommended version |
|---|---|
| Node.js | 22.13 or newer |
| npm | 10 or newer |
| Python | 3.11 or newer for root benchmark/model code; Docker uses Python 3.13 for the web service image. |
| uv | Current stable `uv` package manager. |
| Docker | Optional, for containerized web serving. |

## Local Development

Install frontend dependencies:

```bash
npm ci --prefix frontend
```

Install backend dependencies from the committed backend lockfile:

```bash
uv sync --project backend --frozen
```

Start FastAPI with reload:

```bash
make api
```

Start Vite in a second terminal:

```bash
make web
```

Open the Vite URL shown in the terminal, normally `http://127.0.0.1:5173`. Vite proxies `/api` requests to FastAPI at `http://127.0.0.1:8000`.

Optional local environment setup:

```bash
cp backend/src/.env.sample .env
```

Then edit `.env` and replace `DIANA_SESSION_SECRET` before testing shared or public deployments. `.env` is ignored by Git.

## Production-Style Local Web Run

Build the frontend:

```bash
npm ci --prefix frontend
npm run build --prefix frontend
```

Serve the built SPA through FastAPI:

```bash
uv sync --project backend --frozen
uv run --project backend uvicorn backend.src.main:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000`. FastAPI serves Vite assets, handles `/api/...`, and returns the SPA entry point for deep links such as `/projects/mcphases` or `/participant/dashboard`.

Health endpoint:

```bash
curl http://localhost:8000/api/health
```

## Docker Web Run

Build and run one production service:

```bash
docker build -f Dockerfile.vercel -t diana .
docker run --rm -p 8000:80 diana
```

The final image contains the compiled frontend and starts only FastAPI. Before building Docker images from a governed-data workspace, ensure private datasets, private artifacts, `.env` files, and session secrets are outside the build context or excluded by `.dockerignore`.

## Remotion Explainer Video

The frontend includes a Remotion composition for a DIANA project explainer. It uses synthetic prototype copy and aggregate benchmark language; it does not render private participant data.

Open Remotion Studio:

```bash
npm run video --prefix frontend
```

Render the MP4:

```bash
npm run video:render --prefix frontend
```

The rendered file is written to `frontend/out/diana-project-video.mp4` with H.264 video and AAC audio for broad MP4 player support.

## Frontend and Backend Checks

```bash
npm run lint --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
uv run --project backend python -m py_compile backend/src/main.py
```

The backend command is a syntax compilation check, not an API integration test.

## Benchmark and Model Environment

Install the root benchmark/model package with test dependencies:

```bash
uv sync --extra test
```

Install optional PyTorch acceleration/parity dependencies:

```bash
uv sync --extra test --extra acceleration
```

The root project does not currently include a root `uv.lock`, so this resolves transitive dependencies at install time. The direct dependency versions are pinned in `pyproject.toml`.

## Data-Free H3P Synthetic Run

Use this path when you do not have the governed dataset. It exercises the H3P contract on synthetic data:

```bash
uv run python scripts/run_diana_h3p_v1.py --synthetic
```

## Governed-Data Benchmark Preparation

Real-data reproduction requires mcPHASES 1.0.0 from PhysioNet. Place the dataset at the configured path in `configs/hormonbench_v0.yaml` and `configs/hormonbench_v1.yaml`, or update only the `paths.data_root` value.

The v1 adapter depends on the private v0 participant split manifest, so prepare v0 before v1 when reconstructing private artifacts:

```bash
uv run python -m benchmark prepare --config configs/hormonbench_v0.yaml
uv run python -m benchmark prepare --config configs/hormonbench_v1.yaml
```

## H3P Reproduction Modes

```bash
uv run python scripts/run_diana_h3p_v1.py --verify-only
uv run python scripts/run_diana_h3p_v1.py --development-only
uv run python scripts/run_diana_h3p_v1.py --evaluate-only
uv run python scripts/run_diana_h3p_v1.py --privacy-only
uv run python scripts/run_diana_h3p_v1.py
```

Mode meanings:

| Mode | Meaning |
|---|---|
| `--verify-only` | Validate frozen task settings and required private baseline manifests. |
| `--development-only` | Run fold-0 development diagnostics and backend profiling. |
| `--evaluate-only` | Evaluate existing private predictions and regenerate public aggregate reports. |
| `--privacy-only` | Validate existing public outputs. |
| No mode flag | Run the full canonical H3P pipeline, evaluation, report, and privacy validation. |

The full canonical H3P path requires private prepared bundles, baseline prediction manifests, byte-identical baseline CSVs, and governed data-derived artifacts that are intentionally absent from the public repository.

## Documentation Index

| Document | Purpose |
|---|---|
| [`benchmark/README.md`](benchmark/README.md) | Benchmark package guide. |
| [`benchmark/docs/TASK_CARD_V1.md`](benchmark/docs/TASK_CARD_V1.md) | Active task definition and track rules. |
| [`benchmark/docs/BENCHMARK_CARD_V1.md`](benchmark/docs/BENCHMARK_CARD_V1.md) | Benchmark caveats, leakage controls, and limitations. |
| [`benchmark/docs/DATA_CARD.md`](benchmark/docs/DATA_CARD.md) | Data source meaning, target units, and source limitations. |
| [`benchmark/docs/DATA_ACCESS.md`](benchmark/docs/DATA_ACCESS.md) | Governed-data access and nonredistribution boundary. |
| [`model/diana_h3p/MODEL_CARD.md`](model/diana_h3p/MODEL_CARD.md) | H3P model architecture, results, uncertainty, and limitations. |
| [`docs/CHALLENGE_SUBMISSION.md`](docs/CHALLENGE_SUBMISSION.md) | Benchmark-focused challenge narrative. It predates the later web prototype. |
| [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) | 90-second benchmark demo script. |
| [`docs/RELEASE_SAFETY.md`](docs/RELEASE_SAFETY.md) | Benchmark-release privacy procedure. |

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `GET /api/health` returns `frontend_built: false` | Run `npm run build --prefix frontend` before production-style serving. |
| Non-API route returns 503 | FastAPI cannot find `frontend/dist/index.html`; build the frontend or set `DIANA_FRONTEND_DIST`. |
| Login accepts any password | Expected prototype behavior. There is no real user database. |
| Browser keeps old consent/project state | Clear site data or remove `localStorage` key `diana.prototype.v1`. |
| Root benchmark preparation cannot find data | mcPHASES is not bundled; obtain it from PhysioNet and configure `paths.data_root`. |
| H3P verify/full run fails on missing manifests | Private baseline prediction manifests and CSVs are intentionally not public. |
| Full pytest command fails in a fresh clone | Some tests expect private or generated release artifacts that are not present in the public checkout. Use synthetic and targeted checks unless reconstructing those artifacts. |

## License

DIANA's original code and documentation are released under the MIT License. The license does not redistribute mcPHASES, grant rights to mcPHASES, override PhysioNet terms, or relicense third-party packages, datasets, documentation, model assets, or trademarks. See [`LICENSE`](LICENSE).
