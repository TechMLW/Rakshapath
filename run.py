import sys
import argparse
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent
_SRC_DIR = _REPO_ROOT / "src"
_BACKEND_DIR = _SRC_DIR / "backend"
_AI_DIR = _SRC_DIR / "ai"

for _p in (_SRC_DIR, _BACKEND_DIR, _AI_DIR):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))


def run_backend(host: str, port: int, reload: bool):
    import uvicorn
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        app_dir=str(_BACKEND_DIR),
    )


def run_graph(args):
    from graph.__main__ import main as graph_main
    graph_main()


def run_demo():
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "demo_end_to_end",
        _AI_DIR / "demo_end_to_end.py",
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.main()


def run_frontend(port: int, target_dir: str = "frontend"):
    import subprocess
    import os
    frontend_dir = _REPO_ROOT / target_dir
    if not frontend_dir.exists():
        frontend_dir = _REPO_ROOT / "RakshaPath_Frontend_SIH(1)"
    tools_node = _REPO_ROOT / ".tools" / "node" / "bin"
    env = dict(os.environ)
    if tools_node.exists():
        env["PATH"] = f"{tools_node}:{env.get('PATH', '')}"
    print(f"Starting Raksha-Path React + Vite frontend ({target_dir}) on port {port}...")
    try:
        subprocess.run(["npm", "run", "dev", "--", "--port", str(port)], cwd=str(frontend_dir), env=env, check=True)
    except KeyboardInterrupt:
        print("\nFrontend server stopped.")


def main():
    parser = argparse.ArgumentParser(
        prog="python run.py",
        description="Raksha-Path — AI-Powered Intelligent Route Optimization & Community Safety Platform",
    )
    sub = parser.add_subparsers(dest="command", help="Sub-command")

    backend_p = sub.add_parser("backend", help="Start the FastAPI backend server")
    backend_p.add_argument("--host", default="0.0.0.0", help="Host address (default: 0.0.0.0)")
    backend_p.add_argument("--port", type=int, default=8000, help="Port (default: 8000)")
    backend_p.add_argument("--reload", action="store_true", help="Enable hot-reload (development mode)")

    frontend_p = sub.add_parser("frontend", help="Start the React/Vite frontend development server")
    frontend_p.add_argument("--port", type=int, default=3000, help="Port (default: 3000)")
    frontend_p.add_argument("--dir", default="frontend", help="Target frontend folder (default: frontend, or RakshaPath_Frontend_SIH(1))")

    sub.add_parser("graph", help="Run the graph CLI (download / validate / cache region graph)")
    sub.add_parser("demo", help="Run the end-to-end AI pipeline demo")

    args = parser.parse_args()

    if args.command == "backend":
        print(f"Starting Raksha-Path API server on {args.host}:{args.port}...")
        run_backend(args.host, args.port, args.reload)

    elif args.command == "frontend":
        run_frontend(args.port, args.dir)

    elif args.command == "graph":
        run_graph(args)

    elif args.command == "demo":
        run_demo()

    else:
        parser.print_help()
        print()
        print("Examples:")
        print("  python run.py backend --reload          # development backend API")
        print("  python run.py frontend                  # React/Vite frontend UI")
        print("  python run.py graph                     # graph CLI")
        print("  python run.py demo                      # AI pipeline demo")


if __name__ == "__main__":
    main()
