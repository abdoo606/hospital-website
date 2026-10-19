#!/usr/bin/env python3
"""Generate a reviewable, four-category changelog without executing commit text."""
import argparse
import datetime
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

CATEGORIES = ('Added', 'Fixed', 'Changed', 'Removed')

def git(repo, *args):
    return subprocess.run(['git', '-C', str(repo), *args], check=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout

def classify(subject):
    match = re.match(r'^([a-z]+)(?:\([^)]*\))?!?:\s*(.*)$', subject, re.I)
    kind, text = (match.group(1).lower(), match.group(2)) if match else ('', subject)
    if kind in ('remove', 'removed', 'delete') or re.match(r'^(remove|delete|drop)\b', text, re.I):
        return 'Removed', text
    if kind in ('feat', 'feature', 'add'):
        return 'Added', text
    if kind in ('fix', 'bugfix', 'hotfix'):
        return 'Fixed', text
    return 'Changed', text

def escape(text):
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return re.sub(r'([\\`*_\[\]])', r'\\\1', text)

def collect(repo):
    git(repo, 'rev-parse', '--verify', 'HEAD')
    try:
        tag = git(repo, 'describe', '--tags', '--abbrev=0', 'HEAD').decode().strip()
    except subprocess.CalledProcessError:
        tag = None
    # Resolve to immutable object IDs; no revision syntax from a tag name enters log.
    base = git(repo, 'rev-parse', '--verify', 'refs/tags/' + tag + '^{commit}').decode().strip() if tag else None
    revision = base + '..HEAD' if base else 'HEAD'
    raw = git(repo, 'log', '--no-merges', '--format=%H%x00%s%x00', revision, '--')
    parts = raw.decode('utf-8', errors='replace').split('\0')
    records = []
    for i in range(0, len(parts) - 1, 2):
        oid, subject = parts[i].strip(), parts[i + 1]
        if oid:
            records.append((oid, subject))
    return tag, records

def render(tag, records, date):
    groups = {k: [] for k in CATEGORIES}
    for oid, subject in records:
        category, text = classify(subject)
        groups[category].append(f'- {escape(text)} (`{oid[:12]}`)')
    scope = f'Changes since tag `{escape(tag)}`.' if tag else 'No reachable tag: includes all non-merge commits.'
    lines = ['# Changelog', '', f'## [Unreleased] - {date}', '', scope, '']
    for category in CATEGORIES:
        lines.extend(['### ' + category, ''])
        lines.extend(groups[category] or ['- No changes.'])
        lines.append('')
    return '\n'.join(lines)

def write_output(path, text, force=False):
    path = Path(path)
    if path.is_symlink():
        raise ValueError('Refusing a symbolic-link output path')
    if path.exists() and not force:
        raise ValueError('Output already exists; review it first or use --force explicitly')
    if not force:
        with path.open('x', encoding='utf-8') as out:
            out.write(text)
    else:
        # Replace the directory entry, never follow an output symlink.
        fd, temporary = tempfile.mkstemp(prefix='.changelog-', dir=path.parent)
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as out:
                out.write(text)
            os.replace(temporary, path)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', default='.')
    parser.add_argument('--output', default='CHANGELOG.md')
    parser.add_argument('--date', default=datetime.date.today().isoformat())
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args(argv)
    try:
        datetime.date.fromisoformat(args.date)
        tag, records = collect(args.repo)
        write_output(args.output, render(tag, records, args.date), args.force)
    except (ValueError, OSError, subprocess.CalledProcessError) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        return 1
    print(f'Wrote {args.output}: {len(records)} commits')
    return 0

if __name__ == '__main__':
    sys.exit(main())
