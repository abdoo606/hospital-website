#!/usr/bin/env python3
"""Fail when tracked/staged paths fall outside the reviewed public allowlist."""
import subprocess
import sys

ALLOWED = {
    '.gitignore', 'README.md',
    'docs/STRUCTURE.md', 'docs/WORKFLOW.md', 'docs/PUBLISHING.md',
    'scripts/check_public_boundary.py',
    'services/changelog-bounty/README.md',
    'services/changelog-bounty/LICENSE',
    'services/changelog-bounty/changelog.py',
    'services/changelog-bounty/changelog.sh',
    'services/changelog-bounty/tests/test_changelog.py',
    'services/changelog-bounty/examples/CHANGELOG.md',
    'services/changelog-bounty/examples/tests.txt',
    'services/bash-guard/README.md',
    'services/bash-guard/LICENSE',
    'services/bash-guard/EVIDENCE.md',
    'services/bash-guard/guard.py',
    'services/bash-guard/install.py',
    'services/bash-guard/tests/test_guard.py',
    'services/next-sqlite-template/README.md',
    'services/next-sqlite-template/LICENSE',
    'services/next-sqlite-template/CLAUDE.md',
    'services/next-sqlite-template/EVIDENCE.md',
    'services/next-sqlite-template/.gitignore',
    'services/next-sqlite-template/package.json',
    'services/next-sqlite-template/package-lock.json',
    'services/next-sqlite-template/tsconfig.json',
    'services/next-sqlite-template/next.config.mjs',
    'services/next-sqlite-template/app/layout.tsx',
    'services/next-sqlite-template/app/page.tsx',
    'services/next-sqlite-template/lib/db.ts',
    'services/next-sqlite-template/scripts/migrate.mjs',
    'services/next-sqlite-template/scripts/migrate.test.mjs',
    'services/next-sqlite-template/migrations/0001_initial.sql',
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
