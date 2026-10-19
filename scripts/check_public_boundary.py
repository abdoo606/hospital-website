#!/usr/bin/env python3
"""Fail when tracked/staged paths fall outside the reviewed public allowlist."""
import subprocess
import sys

ALLOWED = {
    '.gitignore', 'README.md',
    'docs/STRUCTURE.md', 'docs/WORKFLOW.md', 'docs/PUBLISHING.md',
    'scripts/check_public_boundary.py',
}

def unexpected(paths):
    return sorted(set(paths) - ALLOWED)

def main():
    raw = subprocess.check_output(['git', 'ls-files', '-z'])
    paths = [p for p in raw.decode('utf-8').split('\0') if p]
    bad = unexpected(paths)
    if bad:
        print('BLOCKED: unreviewed public paths:\n' + '\n'.join(bad))
        return 1
    print(f'PASS: {len(paths)} tracked/staged paths within the public allowlist.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
