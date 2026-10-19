# Git changelog generator — bounty #1 candidate

A Python-standard-library implementation of the published request:
https://github.com/claude-builders-bounty/claude-builders-bounty/issues/1

**Status:** independently prepared candidate for an advertised $50 bounty, not assigned, accepted or paid. Competing submissions exist. The advertised submission route requires an issue claim and upstream PR; this repository is only the candidate's source, not that submission. Payment eligibility and availability require the sponsor's confirmation.

## Setup — three steps
1. Install Python 3.9+ and Git; download this folder (including `changelog.py` and `changelog.sh`). No Python packages are required.
2. From the project to document, run `bash /path/to/changelog.sh`. Alternatively use `--repo /path/to/project --output /path/to/CHANGELOG.md`.
3. Review the generated four sections: **Added**, **Fixed**, **Changed**, **Removed**.

## Behavior
- Uses the nearest reachable Git tag (`git describe --tags --abbrev=0 HEAD`), including annotated and lightweight tags. Reads commits after the tag, excluding merge commits. This means nearest in history, not the largest semantic version.
- Reads local Git history only; it does **not** perform a network `git fetch`. Fetch desired tags/history yourself first. A shallow checkout may lack earlier tags.
- Without a reachable tag, includes all available non-merge commits. An empty repository returns an error.
- Conventional `feat`/`feature`/`add` subjects go to Added; `fix`/`bugfix`/`hotfix` to Fixed; explicit remove/delete kinds or remove/delete/drop descriptions to Removed. Other changes go to Changed. Classification is a deterministic heuristic, not semantic understanding; review before publishing.
- Existing changelogs are **not overwritten by default**. `--force` explicitly replaces the generated file; it does not merge existing release notes. Output symlinks are rejected.
- `--date YYYY-MM-DD` provides reproducible output. Default is the local date. This is an Unreleased section, not an automatically invented version.
- Commit subjects are treated as data, not shell code; HTML and Markdown control characters are escaped.

## Verification
Run `python3 -m unittest discover -s tests -v` from this folder.
15 tests cover category mapping, tag ranges, annotated tags, empty histories, Unicode and shell text, output preservation, symlink rejection, Bash invocation and date validation.

`examples/CHANGELOG.md` was generated from the real public GitHub repository `abdoo606/hospital-website`, at commit `bd8162d86f726aa645f46f4f477c72a72cd5714e`, with date `2026-10-19`. That source has no reachable tags; the sample intentionally exercises the all-history fallback. Tagged repositories are covered by integration fixtures in the tests. Full output is in `examples/tests.txt`.

## AI disclosure and license
Implementation, documentation and tests were prepared and executed by an Arena.ai agent on Abdulrhman's behalf. No independent human review or previous client engagement is claimed. MIT license; see LICENSE.
