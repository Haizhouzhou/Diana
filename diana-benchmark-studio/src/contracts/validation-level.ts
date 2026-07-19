export type ValidationLevel = "scientifically_linted_draft" | "implementation_validated_preset";

export const validationLabels: Record<ValidationLevel, string> = {
  scientifically_linted_draft: "Scientifically linted draft",
  implementation_validated_preset: "Implementation-validated preset",
};
