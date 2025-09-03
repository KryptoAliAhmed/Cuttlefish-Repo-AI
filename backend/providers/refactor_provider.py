import subprocess
import json
from typing import Dict, Any


def run_linter(cmd: list[str]) -> tuple[int, str]:
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return p.returncode, (p.stdout + "\n" + p.stderr).strip()
    except Exception as e:
        return 1, str(e)


def analyze_repository() -> Dict[str, Any]:
    results: Dict[str, Any] = {}
    # Try eslint if available
    code, out = run_linter(["npx", "-y", "eslint", ".", "--format", "json"])
    if code == 0 or out:
        try:
            data = json.loads(out)
            total = sum(len(f.get('messages', [])) for f in data)
            results['eslint_issues'] = total
        except Exception:
            results['eslint_output'] = out[:2000]
    # Try flake8
    code, out = run_linter(["flake8", "."])
    if out:
        results['flake8_output'] = out[:2000]
    # Try solc for gas (if contracts exist)
    code, out = run_linter(["solc", "--optimize", "--gas", "--pretty-json", "contracts/FusionSwarmFactory.sol"])
    if out:
        results['solc_output'] = out[:2000]
    return results


