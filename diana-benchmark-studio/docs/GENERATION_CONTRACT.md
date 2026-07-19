# Generation contract

The compiler normalizes a strict versioned TaskSpec, recursively sorts object keys, preserves semantically ordered arrays, and hashes the UTF-8 canonical JSON with SHA-256. Notebook cell IDs derive from fixed semantic section keys. The notebook uses nbformat 4.5, empty outputs, null execution counts, and Python 3 metadata.

Normalized configuration is encoded as UTF-8 Base64 and decoded by fixed Python. Names and column identifiers never enter Python, shell, import, package, or ZIP paths as source. A fixed `diana-benchmark-program/` root, stable sorted paths, fixed ZIP timestamps, and manifest hashes make the kit reproducible. `manifest.json` intentionally has no self-hash.

The direct Notebook and `benchmark.ipynb` inside the kit are the same bytes. The custom Notebook is standalone; the official Hormonbench Notebook resolves and invokes the verified Diana runner with a static `subprocess.run(..., shell=False)` argument list.
