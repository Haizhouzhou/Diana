import type { TaskSpec } from "../contracts/task-spec";

export function generateRequirements(spec: TaskSpec): string {
  if (spec.mode === "hormonbench_preset") {
    return ["numpy==2.4.4", "pandas==3.0.3", "scipy==1.17.1", "scikit-learn==1.9.0", "catboost==1.2.10", "PyYAML>=6,<7", "psutil>=5.9,<8", "matplotlib>=3.9,<4", "nbformat>=5.10,<6", "nbclient>=0.10,<1", "ipykernel>=6,<7"].join("\n") + "\n";
  }
  const dependencies = ["numpy>=2.0,<3", "pandas>=2.2,<4", "scikit-learn>=1.5,<2", "matplotlib>=3.9,<4", "nbformat>=5.10,<6", "nbclient>=0.10,<1", "ipykernel>=6,<7"];
  if (spec.data.format === "parquet") dependencies.push("pyarrow>=18,<24");
  return `${dependencies.sort().join("\n")}\n`;
}
