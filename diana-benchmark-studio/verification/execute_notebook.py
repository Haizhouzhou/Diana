from __future__ import annotations
from pathlib import Path
import nbformat
from nbclient import NotebookClient

def execute_notebook(path: Path) -> None:
    notebook = nbformat.read(path, as_version=4)
    nbformat.validate(notebook)
    NotebookClient(notebook, timeout=120, kernel_name="python3", resources={"metadata": {"path": str(path.parent)}}, store_widget_state=False, allow_errors=False).execute()

if __name__ == "__main__":
    import sys
    execute_notebook(Path(sys.argv[1]))
