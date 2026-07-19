export const CUSTOM_PROGRAM_CODE = String.raw`
from __future__ import annotations
import io, json, math, os, platform, sys, hashlib
from pathlib import Path
import numpy as np
import pandas as pd
import sklearn
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, f1_score,
    mean_absolute_error, mean_squared_error, roc_auc_score)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, RobustScaler, StandardScaler

CLASSIFICATION = CONFIG["task"]["type"] in {"binary_classification", "multiclass_classification"}
TARGETS = list(CONFIG["data"]["target_columns"])
GROUP = CONFIG["data"]["group_column"]
TIME = CONFIG["data"]["time_column"]

def synthetic_frame():
    """Deterministic compiler fixture. SYNTHETIC EXAMPLE - NOT HEALTH DATA."""
    rng = np.random.default_rng(int(CONFIG["runtime"]["seed"]))
    longitudinal = CONFIG["data"]["layout"] == "longitudinal"
    grouped = CONFIG["data"]["layout"] in {"grouped", "longitudinal"}
    n_groups, steps = (30, 18) if grouped else (1, 360)
    rows = []
    for group_index in range(n_groups):
        group_effect = rng.normal(0, 0.5)
        for step in range(steps):
            row = {}
            if CONFIG["data"]["id_column"]: row[CONFIG["data"]["id_column"]] = f"row-{group_index}-{step}"
            if GROUP: row[GROUP] = f"group-{group_index:02d}"
            if TIME: row[TIME] = pd.Timestamp("2024-01-01") + pd.Timedelta(days=step)
            signal = group_effect + math.sin(step / 4) + rng.normal(0, 0.25)
            for j, column in enumerate(CONFIG["data"]["numeric_features"]): row[column] = signal * (j + 1) + rng.normal(0, .15)
            for j, column in enumerate(CONFIG["data"]["categorical_features"]): row[column] = ["site-a", "site-b", "site-c"][(group_index + step + j) % 3]
            for j, target in enumerate(TARGETS):
                latent = 1.5 + signal * (0.7 + j * .2) + rng.normal(0, .3)
                if CONFIG["task"]["type"] == "binary_classification": row[target] = int(latent > 1.5)
                elif CONFIG["task"]["type"] == "multiclass_classification": row[target] = ["low", "mid", "high"][int(np.clip(np.floor(latent), 0, 2))]
                else: row[target] = max(0.0, latent) if CONFIG["task"]["targets_nonnegative"] else latent
            rows.append(row)
    frame = pd.DataFrame(rows)
    # Exercise the selected reader, including a real in-memory Parquet round trip.
    buffer = io.BytesIO()
    if CONFIG["data"]["format"] == "parquet":
        frame.to_parquet(buffer, index=False); buffer.seek(0); return pd.read_parquet(buffer)
    frame.to_csv(buffer, index=False); buffer.seek(0); return pd.read_csv(buffer, parse_dates=[TIME] if TIME else None)

def load_frame():
    if CONFIG["runtime"]["execution_mode"] == "synthetic" or os.environ.get("DIANA_BENCHMARK_USE_SYNTHETIC") == "1":
        print("SYNTHETIC EXAMPLE - NOT HEALTH DATA")
        return synthetic_frame()
    path = Path(CONFIG["data"]["path"])
    if not path.is_file(): raise FileNotFoundError(f"Local input missing: {path}. Put governed data at the configured relative path.")
    return pd.read_parquet(path) if CONFIG["data"]["format"] == "parquet" else pd.read_csv(path)

def validate_and_engineer(raw):
    if raw.columns.duplicated().any(): raise ValueError("Duplicate input column names are not allowed")
    required = set(CONFIG["data"]["numeric_features"] + CONFIG["data"]["categorical_features"] + TARGETS)
    required.update(x for x in [CONFIG["data"]["id_column"], GROUP, TIME] if x)
    missing = sorted(required - set(raw.columns))
    if missing: raise ValueError(f"Missing required columns: {missing}")
    raw = raw.copy()
    for column in CONFIG["data"]["numeric_features"]:
        raw[column] = pd.to_numeric(raw[column], errors="raise")
        if np.isinf(raw[column].dropna().to_numpy(dtype=float)).any(): raise ValueError(f"Numeric feature contains infinity: {column}")
    if not CLASSIFICATION:
        for target in TARGETS:
            raw[target] = pd.to_numeric(raw[target], errors="raise")
            observed = raw[target].dropna().to_numpy(dtype=float)
            if not np.isfinite(observed).all(): raise ValueError(f"Regression target contains a non-finite value: {target}")
            if CONFIG["task"]["targets_nonnegative"] and (observed < 0).any(): raise ValueError(f"Target {target} was declared nonnegative but contains a negative value")
    if GROUP and raw[GROUP].isna().any(): raise ValueError("Group column contains null values")
    if TIME:
        raw[TIME] = pd.to_datetime(raw[TIME], errors="raise")
        if raw[TIME].isna().any(): raise ValueError("Time column contains null values")
    feature_columns = list(CONFIG["data"]["numeric_features"] + CONFIG["data"]["categorical_features"])
    numeric_columns = list(CONFIG["data"]["numeric_features"])
    if CONFIG["task"]["type"] == "longitudinal_next_step_regression":
        if raw.duplicated([GROUP, TIME]).any(): raise ValueError("Duplicate group-time keys make next-step order ambiguous")
        raw = raw.sort_values([GROUP, TIME], kind="mergesort").reset_index(drop=True)
        engineered = raw.copy()
        for column in CONFIG["data"]["numeric_features"]:
            grouped = raw.groupby(GROUP, sort=False)[column]
            for lag in CONFIG["preprocessing"]["lags"]:
                name = f"{column}__lag_{lag}"; engineered[name] = grouped.shift(lag); feature_columns.append(name); numeric_columns.append(name)
            for window in CONFIG["preprocessing"]["rolling_windows"]:
                name = f"{column}__rolling_mean_{window}"
                engineered[name] = grouped.transform(lambda values: values.shift(1).rolling(window, min_periods=1).mean())
                feature_columns.append(name); numeric_columns.append(name)
        horizon = int(CONFIG["task"]["forecast_horizon"])
        for target in TARGETS: engineered[f"__label__{target}"] = raw.groupby(GROUP, sort=False)[target].shift(-horizon)
        engineered["__target_time"] = raw.groupby(GROUP, sort=False)[TIME].shift(-horizon)
        engineered["__history_count"] = raw.groupby(GROUP, sort=False).cumcount() + 1
    else:
        engineered = raw.copy()
        for target in TARGETS: engineered[f"__label__{target}"] = raw[target]
        if TIME: engineered["__target_time"] = engineered[TIME]
    label_columns = [f"__label__{target}" for target in TARGETS]
    no_future_mask = engineered["__target_time"].isna() if "__target_time" in engineered else pd.Series(False, index=engineered.index)
    missing_label_mask = engineered[label_columns].isna().any(axis=1) & ~no_future_mask
    no_future_rows = int(no_future_mask.sum())
    missing_label_rows = int(missing_label_mask.sum())
    engineered = engineered.loc[~no_future_mask & ~missing_label_mask]
    insufficient_history_rows = 0
    if "__history_count" in engineered:
        insufficient_history_rows = int((engineered["__history_count"] < int(CONFIG["task"]["history_window"])).sum())
        engineered = engineered.loc[engineered["__history_count"] >= int(CONFIG["task"]["history_window"])]
    engineered = engineered.reset_index(drop=True)
    if engineered.empty: raise ValueError("No eligible rows remain after label and history filtering")
    print({"rows": len(engineered), "missing_target_rows_excluded": missing_label_rows, "no_future_target_rows_excluded": no_future_rows, "insufficient_history_rows_excluded": insufficient_history_rows, "features": len(feature_columns)})
    assert not set(TARGETS) & set(feature_columns)
    assert not set(x for x in [GROUP, TIME, CONFIG["data"]["id_column"]] if x) & set(feature_columns)
    return engineered, feature_columns, numeric_columns, label_columns

def split_indices(frame):
    seed = int(CONFIG["split"]["seed"]); vf = float(CONFIG["split"]["validation_fraction"]); tf = float(CONFIG["split"]["test_fraction"])
    split_type = CONFIG["split"]["type"]
    if split_type == "group_disjoint_holdout":
        groups = np.array(sorted(frame[GROUP].unique().tolist())); local = np.random.default_rng(seed); local.shuffle(groups)
        n_test = max(1, round(len(groups) * tf)); n_val = max(1, round(len(groups) * vf))
        if len(groups) < 3 or n_test + n_val >= len(groups): raise ValueError("Group holdout requires at least three groups and nonempty train/validation/test partitions")
        test_groups, val_groups = set(groups[:n_test]), set(groups[n_test:n_test+n_val]); train_groups = set(groups[n_test+n_val:])
        parts = tuple(np.flatnonzero(frame[GROUP].isin(group_set).to_numpy()) for group_set in (train_groups, val_groups, test_groups))
        assert not (train_groups & val_groups or train_groups & test_groups or val_groups & test_groups)
        if any(len(part) == 0 for part in parts): raise ValueError("Group holdout produced an empty partition")
        return parts
    if split_type == "temporal_holdout":
        key = "__target_time" if "__target_time" in frame else TIME
        unique_times = np.array(sorted(pd.Series(frame[key]).dropna().unique().tolist()))
        n_test = max(1, round(len(unique_times) * tf)); n_val = max(1, round(len(unique_times) * vf))
        if len(unique_times) < 3 or n_test + n_val >= len(unique_times): raise ValueError("Temporal holdout requires at least three target times and nonempty train/validation/test partitions")
        train_times = set(unique_times[:-(n_test+n_val)]); val_times = set(unique_times[-(n_test+n_val):-n_test]); test_times = set(unique_times[-n_test:])
        parts = tuple(np.flatnonzero(frame[key].isin(times).to_numpy()) for times in (train_times, val_times, test_times))
        if any(len(part) == 0 for part in parts): raise ValueError("Temporal holdout produced an empty partition")
        assert frame.iloc[parts[0]][key].max() < frame.iloc[parts[1]][key].min()
        assert frame.iloc[parts[1]][key].max() < frame.iloc[parts[2]][key].min()
        return parts
    local = np.random.default_rng(seed); order = local.permutation(len(frame)); n_test = max(1, round(len(order) * tf)); n_val = max(1, round(len(order) * vf))
    parts = order[n_test+n_val:], order[n_test:n_test+n_val], order[:n_test]
    if any(len(part) == 0 for part in parts): raise ValueError("Random holdout produced an empty partition")
    return parts

def preprocessing(numeric_columns, categorical_columns):
    scaler = {"standard": StandardScaler(), "robust": RobustScaler(), "none": "passthrough"}[CONFIG["preprocessing"]["scaling"]]
    numeric = Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", scaler)])
    transformers = [("numeric", numeric, numeric_columns)]
    if categorical_columns:
        categorical = Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))])
        transformers.append(("categorical", categorical, categorical_columns))
    return ColumnTransformer(transformers, remainder="drop")

def estimator(model):
    model_id, p = model["id"], model["parameters"]; seed = int(CONFIG["runtime"]["seed"]); jobs = int(CONFIG["runtime"]["workers"])
    if model_id == "dummy_median": return DummyRegressor(strategy="median")
    if model_id == "ridge": return Ridge(alpha=float(p.get("alpha", 10.0)))
    if model_id == "random_forest_regressor": return RandomForestRegressor(n_estimators=int(p.get("n_estimators", 120)), max_depth=int(p.get("max_depth", 8)), random_state=seed, n_jobs=jobs)
    if model_id == "dummy_prior": return DummyClassifier(strategy=str(p.get("strategy", "prior")))
    if model_id == "logistic_regression": return LogisticRegression(C=float(p.get("C", 1.0)), max_iter=int(p.get("max_iter", 500)), random_state=seed)
    if model_id == "random_forest_classifier": return RandomForestClassifier(n_estimators=int(p.get("n_estimators", 120)), max_depth=int(p.get("max_depth", 8)), random_state=seed, n_jobs=jobs)
    raise ValueError(f"Unknown trusted model ID: {model_id}")

def target_matrix(values):
    array = np.asarray(values)
    return array.reshape(-1, 1) if array.ndim == 1 else array

def target_weights():
    weights = np.array([float(CONFIG["metrics"]["weights"][target]) for target in TARGETS], dtype=float)
    if not np.isfinite(weights).all() or (weights < 0).any() or not np.isclose(weights.sum(), 1.0):
        raise ValueError("Metric target weights must be finite, nonnegative, and sum to one")
    return weights

def weighted_targets(values):
    return float(np.dot(np.asarray(values, dtype=float), target_weights()))

def score_metric(metric_id, y_true, y_pred, groups, train_y, probabilities=None, classes=None):
    if metric_id in {"mae", "rmse", "pearson_r", "group_macro_mae", "normalized_log1p_mae"}:
        truth, predicted, fitted = target_matrix(y_true).astype(float), target_matrix(y_pred).astype(float), target_matrix(train_y).astype(float)
        if metric_id == "mae": return weighted_targets(np.mean(np.abs(truth - predicted), axis=0))
        if metric_id == "rmse": return weighted_targets(np.sqrt(np.mean(np.square(truth - predicted), axis=0)))
        if metric_id == "pearson_r":
            correlations = []
            for target_index in range(truth.shape[1]):
                a, b = truth[:, target_index], predicted[:, target_index]
                correlations.append(np.nan if len(a) < 2 or np.std(a) == 0 or np.std(b) == 0 else np.corrcoef(a, b)[0, 1])
            correlations = np.asarray(correlations, dtype=float)
            if np.any(~np.isfinite(correlations) & (target_weights() > 0)): return None
            return weighted_targets(np.nan_to_num(correlations))
        if metric_id == "group_macro_mae":
            group_scores = []
            for group in sorted(pd.Series(groups).unique().tolist()):
                mask = np.asarray(groups) == group
                group_scores.append(weighted_targets(np.mean(np.abs(truth[mask] - predicted[mask]), axis=0)))
            return float(np.mean(group_scores))
        if (truth < 0).any() or (fitted < 0).any(): raise ValueError("normalized log1p-MAE requires genuinely nonnegative train and test targets")
        scales = np.percentile(np.log1p(fitted), 75, axis=0) - np.percentile(np.log1p(fitted), 25, axis=0)
        if np.any(scales <= 1e-12): raise ValueError("Train-only log1p IQR is zero; normalized metric is unstable")
        return weighted_targets(np.mean(np.abs(np.log1p(truth) - np.log1p(np.maximum(predicted, 0))), axis=0) / scales)
    truth, predicted = np.asarray(y_true).reshape(-1), np.asarray(y_pred).reshape(-1)
    labels = np.asarray(classes) if classes is not None else np.unique(truth)
    if metric_id == "accuracy": return float(accuracy_score(truth, predicted))
    if metric_id == "balanced_accuracy": return float(balanced_accuracy_score(truth, predicted))
    if metric_id == "macro_f1": return float(f1_score(truth, predicted, labels=labels, average="macro", zero_division=0))
    if metric_id == "binary_roc_auc":
        try: return float(roc_auc_score(truth, probabilities))
        except ValueError: return None
    if metric_id == "group_macro_f1":
        values = []
        for group in sorted(pd.Series(groups).unique().tolist()):
            mask = np.asarray(groups) == group
            values.append(f1_score(truth[mask], predicted[mask], labels=labels, average="macro", zero_division=0))
        return float(np.mean(values))
    raise ValueError(f"Unknown trusted metric ID: {metric_id}")

def run_benchmark(frame, feature_columns, numeric_columns, label_columns):
    train_idx, val_idx, test_idx = split_indices(frame)
    categorical = [column for column in feature_columns if column in CONFIG["data"]["categorical_features"]]
    pre = preprocessing(numeric_columns, categorical)
    X = frame[feature_columns]; y = frame[label_columns].to_numpy(); y = y[:, 0] if len(label_columns) == 1 else y
    classes = None
    if CLASSIFICATION:
        classes = np.unique(y)
        expected = 2 if CONFIG["task"]["type"] == "binary_classification" else 3
        if (expected == 2 and len(classes) != 2) or (expected == 3 and len(classes) < 3): raise ValueError(f"Classification target does not satisfy its class-cardinality contract: {len(classes)} classes")
        if set(np.unique(y[train_idx]).tolist()) != set(classes.tolist()): raise ValueError("Training split lacks one or more target classes")
    groups = frame[GROUP].to_numpy() if GROUP else np.array(["all"] * len(frame))
    outputs, predictions = [], []
    metrics = [CONFIG["metrics"]["primary"]] + list(CONFIG["metrics"]["secondary"])
    for model_config in CONFIG["models"]:
        pipe = Pipeline([("preprocessing", clone(pre)), ("model", estimator(model_config))])
        pipe.fit(X.iloc[train_idx], y[train_idx])
        pred = pipe.predict(X.iloc[test_idx]); pred = np.maximum(pred, 0) if not CLASSIFICATION and CONFIG["task"]["targets_nonnegative"] else pred
        probabilities = None
        if "binary_roc_auc" in metrics and hasattr(pipe, "predict_proba"): probabilities = pipe.predict_proba(X.iloc[test_idx])[:, 1]
        scores = {metric: score_metric(metric, y[test_idx], pred, groups[test_idx], y[train_idx], probabilities, classes) for metric in metrics}
        primary = scores[CONFIG["metrics"]["primary"]]
        if primary is None or not np.isfinite(primary): raise ValueError(f"Primary metric {CONFIG['metrics']['primary']} is unavailable for this held-out distribution")
        availability = {f"{metric}__status": ("available" if value is not None else "unavailable: undefined for this held-out distribution") for metric, value in scores.items()}
        outputs.append({"model": model_config["id"], "split": "test", "primary_metric": CONFIG["metrics"]["primary"], "primary_score": primary, "lower_is_better": CONFIG["metrics"]["primary"] not in {"pearson_r", "accuracy", "balanced_accuracy", "macro_f1", "binary_roc_auc", "group_macro_f1"}, **scores, **availability})
        if CONFIG["output"]["save_predictions"]:
            matrix = np.asarray(pred).reshape(len(test_idx), -1)
            for target_index, target in enumerate(TARGETS):
                predictions.append(pd.DataFrame({"model": model_config["id"], "target": target, "row_index": np.arange(len(test_idx)), "prediction": matrix[:, target_index]}))
    leaderboard = pd.DataFrame(outputs).sort_values("primary_score", ascending=bool(outputs[0]["lower_is_better"]), kind="mergesort")
    return leaderboard, {"train": len(train_idx), "validation": len(val_idx), "test": len(test_idx)}, predictions
`;

export const CUSTOM_EXECUTION_CODE = String.raw`
raw = load_frame()
frame, FEATURE_COLUMNS, NUMERIC_COLUMNS, LABEL_COLUMNS = validate_and_engineer(raw)
leaderboard, split_counts, private_predictions = run_benchmark(frame, FEATURE_COLUMNS, NUMERIC_COLUMNS, LABEL_COLUMNS)
assert np.isfinite(leaderboard["primary_score"].dropna()).all()
display(leaderboard)
`;

export const CUSTOM_EXPORT_CODE = String.raw`
RESULTS = Path(CONFIG["output"]["directory"]); RESULTS.mkdir(parents=True, exist_ok=True)
leaderboard.to_csv(RESULTS / "leaderboard.csv", index=False)
metrics_payload = {"fingerprint": PROGRAM_FINGERPRINT, "validation_level": CONFIG["validation_level"], "rows": json.loads(leaderboard.to_json(orient="records"))}
(RESULTS / "metrics.json").write_text(json.dumps(metrics_payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
run_manifest = {"schema_version": 1, "fingerprint": PROGRAM_FINGERPRINT, "python": sys.version.split()[0], "pandas": pd.__version__, "sklearn": sklearn.__version__, "platform": platform.platform(), "seed": CONFIG["runtime"]["seed"], "split_counts": split_counts, "models": [m["id"] for m in CONFIG["models"]], "metrics": [CONFIG["metrics"]["primary"]] + CONFIG["metrics"]["secondary"], "private_predictions_saved": CONFIG["output"]["save_predictions"]}
(RESULTS / "run_manifest.json").write_text(json.dumps(run_manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
if CONFIG["output"]["save_predictions"] and private_predictions:
    pd.concat(private_predictions, ignore_index=True).to_csv(RESULTS / "private_predictions.csv", index=False)
print({"outputs": sorted(path.name for path in RESULTS.iterdir()), "split_counts": split_counts})
`;

export const OFFICIAL_RUNNER_CODE = String.raw`
from __future__ import annotations
import atexit, copy, csv, hashlib, json, os, platform, shutil, subprocess, sys
from pathlib import Path
import yaml

mode = CONFIG["official"]["run_mode"]
repo_value = os.environ.get(CONFIG["official"]["repo_env"], "").strip()
data_value = os.environ.get(CONFIG["official"]["data_env"], "").strip()
if not repo_value: raise FileNotFoundError(f"Set {CONFIG['official']['repo_env']} to a local Diana repository")
repo_root = Path(repo_value).expanduser().resolve()
if not repo_root.is_dir(): raise FileNotFoundError(f"Diana repository directory does not exist: {repo_root}")
if mode == "full" and not data_value: raise FileNotFoundError(f"Set {CONFIG['official']['data_env']} to the licensed local mcPHASES dataset root")
data_root = Path(data_value).expanduser().resolve() if data_value else None
if mode == "full" and (data_root is None or not data_root.is_dir()): raise FileNotFoundError("Licensed local mcPHASES dataset root does not exist")
runner = (repo_root / CONFIG["official"]["runner_path"]).resolve()
if repo_root not in runner.parents or not runner.is_file(): raise FileNotFoundError("Verified Diana runner is missing")
expected_commit = CONFIG["official"]["source_commit"]
subprocess.run(["git", "merge-base", "--is-ancestor", expected_commit, "HEAD"], cwd=repo_root, check=True, shell=False)
runner_hash = hashlib.sha256(runner.read_bytes()).hexdigest()
expected_hash = "fa3f6204a3d747f230fc2b02ab3ac7b0136e6c522cfebc4982c8f4629f20994d"
if runner_hash != expected_hash: raise RuntimeError(f"Runner source hash mismatch: {runner_hash}")

source_files = {
    "baseline_runner": (repo_root / "scripts/run_hormonbench_v1.py", "bd10f5032e57e9fe9b7cdc4ea6c53cf0029493b0b7d4198aeba1c7afb28b592d"),
    "benchmark_config": (repo_root / "configs/hormonbench_v1.yaml", "a114e0be96ed6bc414f2a01a54ea36e93b024d7b1ac64c54e91857b5ab2f54d3"),
    "model_config": (repo_root / "configs/diana_h3p_v1.yaml", "fe09bb4c7db9c6110b67452efbcfcbc683ba5f756e60057d7b8ae127e33fa410"),
    "v0_config": (repo_root / "configs/hormonbench_v0.yaml", None),
    "implementation_spec": (repo_root / "reports/phase1/DIANA_H3P_IMPLEMENTATION_SPEC.md", None),
    "selection_artifact": (repo_root / "reports/phase1/COVARIANCE_SELECTION.json", None),
}
for label, (path, expected) in source_files.items():
    if not path.is_file(): raise FileNotFoundError(f"Required Diana source is missing: {label}")
    if expected and hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise RuntimeError(f"Frozen source hash mismatch: {label}")
results_root = repo_root / "results/v1"
result_entries = {path.relative_to(results_root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(results_root.rglob("*")) if path.is_file()}
results_inventory_hash = hashlib.sha256(json.dumps(result_entries, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
if results_inventory_hash != CONFIG["official"]["results_inventory_hash"]: raise RuntimeError(f"Frozen public result inventory mismatch: {results_inventory_hash}")

run_root = (Path.cwd() / "diana_hormonbench_runs" / PROGRAM_FINGERPRINT[:12]).resolve()
if run_root.exists(): raise FileExistsError(f"Refusing to overwrite existing run directory: {run_root}")
(run_root / "configs").mkdir(parents=True)
operational_paths = []

def write_operational_config(label, value):
    audit_path = run_root / "configs" / f"{label}.operational.yaml"
    write_yaml(audit_path, value)
    runner_path = repo_root / "configs" / f".diana_studio_{PROGRAM_FINGERPRINT[:12]}_{label}.yaml"
    if runner_path.exists(): raise FileExistsError(f"Refusing to overwrite temporary runner config: {runner_path.name}")
    write_yaml(runner_path, value); operational_paths.append(runner_path)
    return runner_path

def cleanup_operational_configs():
    for path in operational_paths:
        try: path.unlink(missing_ok=True)
        except OSError: pass

atexit.register(cleanup_operational_configs)

def read_yaml(path):
    with path.open(encoding="utf-8") as handle: return yaml.safe_load(handle)

def write_yaml(path, value):
    path.write_text(yaml.safe_dump(value, sort_keys=False), encoding="utf-8")

def make_operational_configs():
    """Copy frozen scientific settings and redirect every generated artifact to run_root."""
    v0 = copy.deepcopy(read_yaml(source_files["v0_config"][0]))
    v0["paths"].update({
        "data_root": str(data_root),
        "prepared_dir": str(run_root / "private/v0/prepared"),
        "split_dir": str(run_root / "private/v0/splits"),
        "prediction_dir": str(run_root / "private/v0/predictions"),
        "checkpoint_dir": str(run_root / "private/v0/checkpoints"),
        "results_dir": str(run_root / "results/v0"),
    })
    v0_path = write_operational_config("hormonbench_v0", v0)

    bench = copy.deepcopy(read_yaml(source_files["benchmark_config"][0]))
    bench["paths"].update({
        "data_root": str(data_root),
        "v0_split_manifest": str(run_root / "private/v0/splits/hormonbench_mcphases_interval2_nextday_v0.json"),
        "prepared_dir": str(run_root / "private/v1/prepared/hormonbench_mcphases_interval2_nextday_v1_1.0.0"),
        "fold_dir": str(run_root / "private/v1/folds"),
        "calibration_dir": str(run_root / "private/v1/calibration"),
        "prediction_run_dir": str(run_root / "private/v1/predictions/canonical_v1_full"),
        "prediction_manifest": str(run_root / "private/v1/predictions/canonical_v1_full/manifest.json"),
        "checkpoint_dir": str(run_root / "private/v1/checkpoints/canonical_v1_full"),
        "participant_metrics_dir": str(run_root / "private/v1/participant_metrics/canonical_v1_full"),
        "invalidated_prediction_run_dir": str(run_root / "private/v1/predictions/unused_legacy_source"),
        "invalidated_prediction_manifest": str(run_root / "private/v1/predictions/unused_legacy_source/manifest.json"),
        "invalidated_checkpoint_dir": str(run_root / "private/v1/checkpoints/unused_legacy_source"),
        "validation_dir": str(run_root / "private/v1/validation"),
        "selection_artifact": str(source_files["selection_artifact"][0]),
        "results_dir": str(run_root / "results/v1/historical_protocol_compromised_comparator"),
    })
    bench["runtime"]["canonical_run_id"] = f"studio_{PROGRAM_FINGERPRINT[:12]}"
    bench_path = write_operational_config("hormonbench_v1", bench)

    h3p = copy.deepcopy(read_yaml(source_files["model_config"][0]))
    baseline_dir = run_root / "private/v1/predictions/canonical_v1_full"
    preserved_dir = run_root / "private/v1/predictions/preserved_baselines"
    h3p["benchmark_config"] = str(bench_path)
    h3p["paths"].update({
        "baseline_prediction_dir": str(baseline_dir),
        "baseline_prediction_manifest": str(baseline_dir / "manifest.json"),
        "preserved_baseline_dir": str(preserved_dir),
        "preserved_baseline_manifest": str(preserved_dir / "manifest.json"),
        "private_run_root": str(run_root / "private/v1/diana_h3p"),
        "prediction_dir": str(run_root / "private/v1/diana_h3p/predictions"),
        "prediction_manifest": str(run_root / "private/v1/diana_h3p/predictions/manifest.json"),
        "oof_dir": str(run_root / "private/v1/diana_h3p/oof"),
        "checkpoint_dir": str(run_root / "private/v1/diana_h3p/checkpoints"),
        "participant_metrics_dir": str(run_root / "private/v1/diana_h3p/participant_metrics"),
        "audit_dir": str(run_root / "private/v1/diana_h3p/manifests"),
        "results_dir": str(run_root / "results/v1/diana_h3p"),
        "implementation_spec": str(source_files["implementation_spec"][0]),
    })
    h3p["runtime"]["run_id"] = f"studio_{PROGRAM_FINGERPRINT[:12]}"
    h3p["runtime"]["training_code_commit"] = CONFIG["official"]["training_code_commit"]
    h3p_path = write_operational_config("diana_h3p_v1", h3p)
    return v0_path, bench_path, h3p_path, baseline_dir, preserved_dir

commands = []
if mode == "full":
    v0_config, benchmark_config, model_config, baseline_dir, preserved_dir = make_operational_configs()
    commands.extend([
        [sys.executable, "-m", "benchmark", "prepare", "--config", str(v0_config)],
        [sys.executable, str(source_files["baseline_runner"][0]), "--config", str(benchmark_config)],
    ])
    for args in commands:
        print({"task": CONFIG["official"]["task_id"], "mode": mode, "args": args[1:3], "shell": False})
        subprocess.run(args, cwd=repo_root, check=True, shell=False)
    if preserved_dir.exists(): raise FileExistsError(preserved_dir)
    shutil.copytree(baseline_dir, preserved_dir)
    args = [sys.executable, str(runner), "--benchmark-config", str(benchmark_config), "--model-config", str(model_config)]
elif mode == "synthetic":
    args = [sys.executable, str(runner), "--benchmark-config", str(source_files["benchmark_config"][0]), "--model-config", str(source_files["model_config"][0]), "--synthetic"]
else:
    args = [sys.executable, "-c", "import numpy, pandas, scipy, sklearn, catboost, yaml, psutil, matplotlib; print('hormonbench-preflight-imports-ok')"]
print({"task": CONFIG["official"]["task_id"], "mode": mode, "runner": str(runner.relative_to(repo_root)), "shell": False})
completed = subprocess.run(args, cwd=repo_root, check=True, shell=False)
evidence_root = (run_root / "results/v1/diana_h3p") if mode == "full" else (repo_root / "results/v1/diana_h3p")
def aggregate_scores(path):
    with path.open(newline="", encoding="utf-8") as handle:
        return {(int(row["calibration_budget"]), row["model_name"]): float(row["overall_normalized_score"]) for row in csv.DictReader(handle)}
cold = aggregate_scores(evidence_root / "cold_start" / "leaderboard.csv")
few = aggregate_scores(evidence_root / "few_shot" / "leaderboard_by_budget.csv")
expected = {"cold_population_median": 0.6365265832207976, "k3_population_median": 0.6108523184435343, "k7_catboost": 0.6071950846473766}
observed = {"cold_population_median": cold[(0, "population_median")], "k3_population_median": few[(3, "population_median")], "k7_catboost": few[(7, "catboost")]}
comparison = {key: {"expected": expected[key], "observed": observed[key], "tolerance": 1e-6, "matches": abs(expected[key] - observed[key]) <= 1e-6} for key in expected}
if not all(item["matches"] for item in comparison.values()): raise RuntimeError("Frozen aggregate Hormonbench evidence mismatch")
manifest = {"schema_version": 1, "program_fingerprint": PROGRAM_FINGERPRINT, "task_id": CONFIG["official"]["task_id"], "task_spec_hash": CONFIG["official"]["task_spec_hash"], "fold_hash": CONFIG["official"]["fold_hash"], "input_schema_hash": CONFIG["official"]["input_schema_hash"], "results_inventory_hash": results_inventory_hash, "runner_sha256": runner_hash, "returncode": completed.returncode, "python": sys.version.split()[0], "platform": platform.platform(), "mode": mode, "run_root": str(run_root), "frozen_aggregate_comparison": comparison}
(run_root / "run_manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print({"local_run_manifest": str(run_root / "run_manifest.json")})
`;
