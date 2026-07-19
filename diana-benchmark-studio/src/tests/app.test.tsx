import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../App";
describe("Studio application", () => {
  it("renders the product workflow", () => { render(<App />); expect(screen.getByRole("heading", { name: /Turn a research protocol/i })).toBeInTheDocument(); expect(screen.getByText(/Programs are generated in this browser/i)).toBeInTheDocument(); });
  it("opens the split-pane Studio and demonstrates leakage lint", async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole("link", { name: /Design a benchmark/i })); await user.click(screen.getByRole("button", { name: /Split/ })); await user.click(screen.getByLabelText("Random holdout")); expect(await screen.findByText("Participant leakage across rows")).toBeInTheDocument(); const download = screen.getByRole("button", { name: /Kit/ }); expect(download).toBeDisabled(); await user.click(screen.getByLabelText("Group-disjoint")); expect(screen.queryByText("Participant leakage across rows")).not.toBeInTheDocument(); });
  it("shows honest Hormonbench evidence", async () => { window.history.pushState({}, "", "/preset/hormonbench-mcphases-v1"); render(<App />); expect(screen.getByText("Implementation-validated preset")).toBeInTheDocument(); expect(screen.getByText("1,509")).toBeInTheDocument(); expect(screen.getAllByText("population_median").length).toBeGreaterThan(0); });
});
