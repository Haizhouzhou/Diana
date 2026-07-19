export function ValidationIndicator({ state }: { state: "complete" | "warning" | "error" }) { return <span className={`validation-dot ${state}`} aria-label={state} />; }
