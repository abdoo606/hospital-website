#!/usr/bin/env python3
"""Accidental destructive-command guard, NOT a shell security boundary."""
import datetime
import json
import os
from pathlib import Path
import re
import shlex
import sys


def sql_code(text):
    # Ignore SQL strings, quoted identifiers and comments when seeking WHERE.
    return re.sub(r"'(?:''|[^'])*'|\"(?:\"\"|[^\"])*\"|`[^`]*`|\[[^\]]*\]|/\*[\s\S]*?\*/|--[^\n]*", ' ', text)


def reasons(command):
    try:
        lexer = shlex.shlex(command, posix=True, punctuation_chars=';&|()')
        lexer.whitespace_split = True
        lexer.commenters = '#'
        tokens = list(lexer)
    except ValueError:
        return ['Cannot parse shell quoting; review command manually.']
    found = []
    for i, token in enumerate(tokens):
        name = token.rsplit('/', 1)[-1]
        following = []
        for item in tokens[i+1:]:
            if item and all(c in ';&|()' for c in item):
                break
            following.append(item)
        if name == 'rm':
            flags = following[:following.index('--')] if '--' in following else following
            recursive = any(x == '--recursive' or (x.startswith('-') and not x.startswith('--') and ('r' in x or 'R' in x)) for x in flags)
            force = any(x == '--force' or (x.startswith('-') and not x.startswith('--') and 'f' in x) for x in flags)
            if recursive and force:
                found.append('Recursive forced removal (rm -rf) requires manual review.')
        if name == 'git' and 'push' in following:
            args = following[following.index('push')+1:]
            if any(x == '-f' or x.startswith('--force') or x.startswith('+') or (x.startswith('-') and not x.startswith('--') and 'f' in x) for x in args):
                found.append('Force-pushing can overwrite remote history.')
        if name in ('bash', 'sh', 'zsh'):
            for n, flag in enumerate(following[:-1]):
                if flag.startswith('-') and 'c' in flag:
                    found.extend(reasons(following[n+1]))
                    break
    # Each shell token may hold a complete quoted SQL command; also inspect the
    # joined tokens for unquoted SQL. This deliberately errs on the cautious side.
    for candidate in tokens + [' '.join(tokens)]:
        code = sql_code(candidate)
        for statement in code.split(';'):
            if re.search(r'\bDROP\s+TABLE\b', statement, re.I):
                found.append('DROP TABLE destroys a table.')
            if re.search(r'\bTRUNCATE\b', statement, re.I):
                found.append('TRUNCATE removes all rows.')
            for match in re.finditer(r'\bDELETE\s+FROM\b', statement, re.I):
                if not re.search(r'\bWHERE\b', statement[match.end():], re.I):
                    found.append('DELETE FROM without WHERE can remove all rows.')
    return list(dict.fromkeys(found))


def record(command, cwd, why):
    folder = Path.home()/'.claude'/'hooks'
    folder.mkdir(parents=True, exist_ok=True)
    flags = os.O_WRONLY | os.O_CREAT | os.O_APPEND | getattr(os, 'O_NOFOLLOW', 0)
    fd = os.open(folder/'blocked.log', flags, 0o600)
    with os.fdopen(fd, 'a', encoding='utf-8') as out:
        os.fchmod(out.fileno(), 0o600)
        out.write(json.dumps({'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                              'command': command, 'project_path': cwd, 'reasons': why}, ensure_ascii=False)+'\n')


def main():
    command, cwd = '<invalid hook payload>', ''
    try:
        payload = json.load(sys.stdin)
        if not isinstance(payload, dict):
            raise ValueError('Expected object')
        if payload.get('tool_name') != 'Bash':
            return 0
        command = payload['tool_input']['command']
        cwd = payload.get('cwd', '')
        if not isinstance(command, str) or not isinstance(cwd, str):
            raise ValueError('Command and cwd must be strings')
        why = reasons(command)
    except (ValueError, KeyError, TypeError, RecursionError):
        why = ['Invalid or excessively nested hook input; manual review required.']
    if not why:
        return 0
    try:
        record(command, cwd, why)
    except OSError as exc:
        print(f'Blocked; audit log could not be written: {exc}', file=sys.stderr)
    print('Blocked by destructive-command guard: '+' '.join(why), file=sys.stderr)
    return 2

if __name__ == '__main__':
    sys.exit(main())
