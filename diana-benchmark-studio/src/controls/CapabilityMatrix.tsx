export function CapabilityMatrix() {
  const rows = [["CSV", "Static, grouped, longitudinal", "Executable"], ["Parquet", "Static, grouped, longitudinal", "Executable"], ["Regression", "Single, multi-target, next-step", "Executable"], ["Classification", "Binary, multiclass", "Executable"]];
  return <table className="capability-table"><caption>Generated-program capabilities</caption><thead><tr><th>Capability</th><th>Scope</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index ? <td key={cell}>{cell}</td> : <th scope="row" key={cell}>{cell}</th>)}</tr>)}</tbody></table>;
}
