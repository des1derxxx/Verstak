import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import pytest


@pytest.fixture
def healthcheck_arguments(tmp_path):
    captured = tmp_path / "arguments.json"
    mongosh = tmp_path / "mongosh"
    mongosh.write_text(
        f"#!{sys.executable}\n"
        "import json, os, sys\n"
        "from pathlib import Path\n"
        "Path(os.environ['CAPTURE_ARGUMENTS']).write_text(json.dumps(sys.argv[1:]))\n"
    )
    mongosh.chmod(0o700)
    username = 'admin user'
    password = 'example with $dollar and "quotes"'
    environment = {
        **os.environ,
        "PATH": str(tmp_path) + os.pathsep + os.environ["PATH"],
        "MONGO_INITDB_ROOT_USERNAME": username,
        "MONGO_INITDB_ROOT_PASSWORD": password,
        "CAPTURE_ARGUMENTS": str(captured),
    }
    root = Path(__file__).resolve().parents[2]
    subprocess.run(["bash", str(root / "deploy/mongo/healthcheck.sh")], env=environment, check=True)
    return json.loads(captured.read_text())


def test_mongo_healthcheck_preserves_credentials_and_valid_javascript(healthcheck_arguments):
    """Catch accidental YAML/shell escaping without requiring Docker or MongoDB."""
    arguments = healthcheck_arguments
    username = 'admin user'
    password = 'example with $dollar and "quotes"'
    assert arguments[arguments.index("--username") + 1] == username
    assert arguments[arguments.index("--password") + 1] == password
    assert arguments[arguments.index("--host") + 1] == "127.0.0.1"
    script = arguments[arguments.index("--eval") + 1]
    assert '\\"' not in script
    node = shutil.which("node")
    if node:
        subprocess.run([node, "-e", "new (require('node:vm').Script)(process.argv[1])", script], check=True)


@pytest.mark.parametrize(
    "status,error_code,expected",
    [
        ({}, 94, 0),  # Ready for mongo-init; do not deadlock the dependency.
        ({"set": "rs0", "myState": 1}, None, 0),
        ({"set": "rs0", "myState": 2}, None, 0),
        ({"set": "wrong-set"}, None, 1),
        ({}, 76, 1),  # Temporary standalone process used by the official image.
        ({}, 13, 1),  # A real permission failure must remain unhealthy.
    ],
)
def test_mongo_healthcheck_handles_bootstrap_states(healthcheck_arguments, status, error_code, expected):
    node = shutil.which("node")
    if not node:
        pytest.skip("Node.js is required to exercise the mongosh JavaScript")
    script = healthcheck_arguments[healthcheck_arguments.index("--eval") + 1]
    harness = """
      const vm = require('node:vm');
      const scenario = JSON.parse(process.argv[2]);
      let result;
      const context = {
        rs: { status() {
          if (scenario.error !== null) throw {code: scenario.error};
          return scenario.status;
        } },
        print() {},
        quit(code) { throw {exitCode: code}; }
      };
      try { vm.runInNewContext(process.argv[1], context); }
      catch (error) { result = error.exitCode === undefined ? 1 : error.exitCode; }
      if (result !== scenario.expected) {
        throw new Error(`Expected exit ${scenario.expected}, got ${result}`);
      }
    """
    subprocess.run([node, "-e", harness, script, json.dumps({"status": status, "error": error_code, "expected": expected})], check=True)
