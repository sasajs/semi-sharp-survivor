#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

python3 - <<'PY'
from pathlib import Path
import re

p = Path("vite.config.ts")
s = p.read_text()

server_block = re.compile(r"    server: \{\n.*?    \},", re.S)

new = """    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'semisharp.steveschilhabel.com',
      ],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },"""

s2, n = server_block.subn(new, s, count=1)
if n != 1:
    raise SystemExit("Could not locate Vite server block.")

p.write_text(s2)
print("✓ vite.config.ts repaired")
PY
