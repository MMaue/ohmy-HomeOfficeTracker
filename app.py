"""
app.py — single entry point for the PyInstaller build.

Running from source (dev):
    python app.py

Running as a frozen EXE:
    Double-click HomeOfficeTracker.exe
"""

import multiprocessing
import webbrowser
import threading

# When frozen, PyInstaller extracts modules to sys._MEIPASS but the
# working directory may differ.  No path manipulation is needed here
# because PyInstaller follows the "from backend.main import app" import
# chain automatically and bundles backend/ as a proper package.

def _open_browser():
    webbrowser.open_new("http://localhost:8000")


if __name__ == "__main__":
    # Required on Windows when using multiprocessing inside a frozen EXE.
    multiprocessing.freeze_support()

    import uvicorn
    from backend.main import app          # PyInstaller follows this import

    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║        Home Office Tracker               ║")
    print("  ║                                          ║")
    print("  ║   Open  →  http://localhost:8000         ║")
    print("  ║   Stop  →  close this window             ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    # Open the browser after a short delay so uvicorn is ready
    threading.Timer(2.0, _open_browser).start()

    # Pass the app *object* (not a string) — required for frozen mode
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
