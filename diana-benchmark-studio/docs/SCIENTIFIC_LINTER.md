# Scientific linter

The deterministic linter reports blocking issues, scientific warnings, and passed checks with affected fields and concrete corrections. It covers temporal boundaries, group separation, train-only preprocessing, explicit column roles, task/model/metric compatibility, hormonal-label provenance, causal transformations, and comparison-cohort integrity.

For custom longitudinal programs, history and horizon are group-sorted observation steps. Duplicate or missing group-time keys block generation. Random-row splits block grouped longitudinal work because the same participant could enter multiple partitions. Temporal splits are ordered by target time, and causal lags/rolling summaries use only prior rows within a group.

Passing the linter means **Scientifically linted draft**, not implementation or clinical validation.
