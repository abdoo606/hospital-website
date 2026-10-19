# Destructive-command guard — bounty #3 candidate

Request: https://github.com/claude-builders-bounty/claude-builders-bounty/issues/3 ($100 advertised, not awarded).

Python 3.9+, Unix-like OS. This **accidental-command guard is not a sandbox or a complete shell/SQL parser**. It does not execute submitted commands.

## Install — two commands
After downloading this folder, run:
```sh
cd /path/to/bash-guard
python3 install.py
```
The installer copies the guard into `~/.claude/hooks/`, merges a Bash PreToolUse entry into `~/.claude/settings.json`, preserves other settings, and saves an original-settings backup when applicable. Restart Claude Code and check `/hooks` before relying on it. The installer does not replace the original backup on subsequent runs.

## Behavior and verification
- Blocks common recursive+forced `rm` flag combinations, force pushes (including force-with-lease and `+` refspecs), DROP TABLE, TRUNCATE and DELETE FROM without a WHERE token in that SQL statement.
- Handles common quoted SQL, shell command chains and explicit shell `-c` invocations. Removes SQL comments and string literals before checking WHERE.
- Writes blocked attempts as JSON lines with UTC timestamp, command, project path and reason to `~/.claude/hooks/blocked.log`, mode 0600. JSON encoding prevents newline log injection. Logging failures still block.
- Returns exit 2 with a readable stderr explanation; normal commands return 0 without granting extra permissions.
- Tests exercise 16 blocked and 12 ordinary command examples, hook subprocess behavior, logging permissions, malformed input and preserving existing settings.

Run `python3 -m unittest discover -s tests -v`. Result: **10 test methods passed**, including the command matrices. Neither destructive commands nor SQL strings are executed by these tests.

## Important limitations
No defense against an adversarial agent: variables, aliases, encoded payloads, arbitrary scripts, indirect SQL files, other tools and dynamic shell expansion can bypass static inspection. WHERE 1=1 is not made safe by the presence of WHERE. Conservative scanning may also block harmless documentation commands containing destructive SQL. This is a usability/safety tradeoff, not a promise of zero false positives. Use OS permissions, database roles, backups, human approvals and a real sandbox for enforcement. A user can disable this hook.

The audit log intentionally includes complete blocked commands and may contain secrets; keep it private, set retention, and do not upload it. No retention daemon is installed. The installer assumes your own trusted home directory and local settings; it is not a privilege boundary.

Protocol was checked against Anthropic's public `examples/hooks/bash_command_validator_example.py`. Actual Claude Code session integration has **not** been tested here because that CLI is unavailable. Do not label this fully accepted before that check and maintainer review. To uninstall, remove only this guard's PreToolUse entry and `destructive_guard.py`; retain or securely delete the log as appropriate, and do not overwrite newer settings with an old backup blindly.

AI-assisted candidate prepared on Abdulrhman's behalf using Arena.ai. MIT license. Not assigned, formally claimed, accepted or paid; competing submissions exist. Upstream PR submission is currently blocked by integration permissions.
