from __future__ import annotations
import hashlib
import json
import sys
import zipfile
from pathlib import Path
import nbformat

def verify(notebook_path: Path, zip_path: Path) -> dict[str, object]:
    direct = notebook_path.read_bytes()
    with zipfile.ZipFile(zip_path) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names))
        assert all(name.startswith("diana-benchmark-program/") for name in names)
        assert not any(".." in name or "\\" in name for name in names)
        inside = archive.read("diana-benchmark-program/benchmark.ipynb")
        assert direct == inside
        manifest = json.loads(archive.read("diana-benchmark-program/manifest.json"))
        assert hashlib.sha256(inside).hexdigest() == manifest["notebook_sha256"]
        for relative_path, expected_hash in manifest["files"].items():
            actual = hashlib.sha256(archive.read(f"diana-benchmark-program/{relative_path}")).hexdigest()
            assert actual == expected_hash, relative_path
    notebook = nbformat.reads(direct.decode("utf-8"), as_version=4)
    nbformat.validate(notebook)
    return {"status": "passed", "direct_zip_identical": True, "files": len(names), "notebook_sha256": manifest["notebook_sha256"]}

if __name__ == "__main__":
    print(json.dumps(verify(Path(sys.argv[1]), Path(sys.argv[2])), indent=2))
