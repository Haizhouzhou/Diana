from __future__ import annotations
import json
from pathlib import Path
import numpy as np
import pandas as pd
import nbformat
from sklearn.base import clone
from execute_notebook import execute_notebook
from validate_notebook import validate_notebook

ROOT = Path(__file__).resolve().parent / ".generated"

def namespace_for(path: Path) -> dict[str, object]:
    notebook = nbformat.read(path, as_version=4)
    namespace: dict[str, object] = {"display": lambda value: value}
    wanted = {"decode-config", "program-functions"}
    for cell in notebook.cells:
        if cell.cell_type == "code" and cell.id in wanted:
            exec(compile(cell.source, f"{path.name}:{cell.id}", "exec"), namespace)
    return namespace

def mutation_checks(path: Path) -> dict[str, bool]:
    ns = namespace_for(path); config = ns["CONFIG"]
    if config["task"]["type"] != "longitudinal_next_step_regression":
        return {"applicable": False}
    raw = ns["synthetic_frame"]()
    original, features, numeric, _ = ns["validate_and_engineer"](raw)
    assert (original["__history_count"] >= int(config["task"]["history_window"])).all()
    mutated = raw.copy(); group = config["data"]["group_column"]; time = config["data"]["time_column"]
    chosen_group = sorted(mutated[group].unique())[0]; rows = mutated.index[mutated[group] == chosen_group]; last = rows[-1]
    mutated.loc[last, config["data"]["numeric_features"][0]] = 1e9
    changed, changed_features, _, _ = ns["validate_and_engineer"](mutated)
    assert features == changed_features
    cutoff = pd.to_datetime(mutated.loc[last, time])
    early = (original[group] == chosen_group) & (pd.to_datetime(original[time]) < cutoff)
    np.testing.assert_allclose(original.loc[early, numeric].to_numpy(dtype=float), changed.loc[early, numeric].to_numpy(dtype=float), equal_nan=True)
    categorical_features = [column for column in features if column not in numeric]
    if categorical_features:
        pd.testing.assert_frame_equal(original.loc[early, categorical_features].reset_index(drop=True), changed.loc[early, categorical_features].reset_index(drop=True))
    assert not set(config["data"]["target_columns"]) & set(features)
    target_mutated = raw.copy()
    target_mutated[config["data"]["target_columns"]] = target_mutated[config["data"]["target_columns"]] + 1000
    target_changed, target_features, _, _ = ns["validate_and_engineer"](target_mutated)
    assert target_features == features
    pd.testing.assert_frame_equal(original[features], target_changed[features], check_dtype=False)
    shuffled, shuffled_features, _, _ = ns["validate_and_engineer"](raw.sample(frac=1, random_state=991))
    assert shuffled_features == features
    pd.testing.assert_frame_equal(original[[group, time] + features], shuffled[[group, time] + features], check_dtype=False)
    duplicate = pd.concat([raw, raw.iloc[[0]]], ignore_index=True)
    try:
        ns["validate_and_engineer"](duplicate)
    except ValueError as error:
        assert "Duplicate group-time" in str(error)
    else:
        raise AssertionError("Duplicate group-time did not fail")
    train_idx, val_idx, test_idx = ns["split_indices"](original)
    changed_train, changed_val, changed_test = ns["split_indices"](target_changed)
    for left, right in zip((train_idx, val_idx, test_idx), (changed_train, changed_val, changed_test), strict=True):
        np.testing.assert_array_equal(left, right)
    if config["split"]["type"] == "group_disjoint_holdout":
        sets = [set(original.iloc[idx][group]) for idx in (train_idx, val_idx, test_idx)]
        assert not (sets[0] & sets[1] or sets[0] & sets[2] or sets[1] & sets[2])
    if config["split"]["type"] == "temporal_holdout":
        assert original.iloc[train_idx]["__target_time"].max() < original.iloc[val_idx]["__target_time"].min()
        assert original.iloc[val_idx]["__target_time"].max() < original.iloc[test_idx]["__target_time"].min()
    categorical = [column for column in features if column in config["data"]["categorical_features"]]
    pre_a = ns["preprocessing"](numeric, categorical); pre_b = clone(pre_a)
    x = original[features]; x_mutated = x.copy(); x_mutated.iloc[test_idx, 0] = 1e12
    transformed_a = pre_a.fit_transform(x.iloc[train_idx]); transformed_b = pre_b.fit_transform(x_mutated.iloc[train_idx])
    np.testing.assert_allclose(transformed_a, transformed_b)
    try:
        ns["validate_and_engineer"](raw.drop(columns=[config["data"]["numeric_features"][0]]))
    except ValueError as error:
        assert "Missing required columns" in str(error)
    else:
        raise AssertionError("Missing required column did not fail")
    return {"applicable": True, "future_mutation": True, "target_excluded": True, "target_mutation": True, "train_only_preprocessing": True, "split_integrity": True, "row_shuffle": True, "duplicate_key_rejected": True}

def main() -> None:
    cases = []
    for directory in sorted(path for path in ROOT.iterdir() if path.is_dir()):
        notebook = directory / "benchmark.ipynb"; structural = validate_notebook(notebook); execute_notebook(notebook)
        leaderboard = pd.read_csv(directory / "results" / "leaderboard.csv")
        metrics = json.loads((directory / "results" / "metrics.json").read_text(encoding="utf-8"))
        manifest = json.loads((directory / "results" / "run_manifest.json").read_text(encoding="utf-8"))
        assert {"model", "primary_metric", "primary_score", "lower_is_better"} <= set(leaderboard.columns)
        assert np.isfinite(leaderboard["primary_score"]).all()
        assert metrics["rows"] and manifest["split_counts"]["test"] > 0
        cases.append({"case": directory.name, **structural, "rows": len(leaderboard), "mutations": mutation_checks(notebook)})
    print(json.dumps({"status": "passed", "cases": cases, "case_count": len(cases)}, indent=2))

if __name__ == "__main__":
    main()
