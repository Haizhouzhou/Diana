export interface AggregateLeaderboardRow {
  model: string;
  primary_metric: string;
  primary_score: number;
  split: "test";
  lower_is_better: boolean;
}

export interface AggregateRunManifest {
  schema_version: 1;
  fingerprint: string;
  seed: number;
  train_rows: number;
  validation_rows: number;
  test_rows: number;
  models: string[];
  metrics: string[];
  private_predictions_saved: boolean;
}
