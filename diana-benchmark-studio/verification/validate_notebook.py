from __future__ import annotations
import json
import re
from pathlib import Path
import nbformat

def validate_notebook(path: Path) -> dict[str, object]:
    notebook = nbformat.read(path, as_version=4)
    nbformat.validate(notebook)
    ids = [cell.id for cell in notebook.cells]
    assert len(ids) == len(set(ids)), "Notebook cell IDs must be unique"
    for cell in notebook.cells:
        if cell.cell_type == "code":
            assert cell.execution_count is None
            assert cell.outputs == []
    text = path.read_text(encoding="utf-8")
    assert not re.search(r"[A-Za-z]:\\\\(?:Users|Hack_Nation|dataset|artifacts)\\\\", text)
    assert "base64.b64decode" in text
    return {"cells": len(notebook.cells), "ids_unique": True, "nbformat": notebook.nbformat}

if __name__ == "__main__":
    import sys
    print(json.dumps(validate_notebook(Path(sys.argv[1]))))
