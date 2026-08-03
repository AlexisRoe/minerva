#!/usr/bin/env python3
"""
check-i18n-usage.py

Scans a project's source for translation keys and reports the ones that do not
exist in the default language's catalogue. Dynamic lookups, which cannot be
checked statically, are reported as warnings.

Requirements: Python 3 standard library only.
Usage:        ./scripts/check-i18n-usage.py PROJECT [PROJECT ...] [-d en] [--json]
Output:       one line per finding (human), or a JSON report with `--json`.
"""

from __future__ import annotations

import difflib
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from i18n_common import (  # noqa: E402
    FAIL,
    OK,
    SKIP_DIRS,
    WARN,
    build_parser,
    discover_projects,
    emit,
    flatten,
    heading,
    load_json,
    paint,
    relative,
    rule,
)

EPILOG = """\
For an AI agent
---------------
WHAT IT DOES
  Reads the default language's catalogue, then greps the project's TypeScript /
  JavaScript for translation lookups and reports every literal key that the
  catalogue does not define -- these are ERRORS, the string would render as its
  raw key at runtime. Lookups whose key is not a literal (t(someVariable), a
  template literal containing ${...}) cannot be resolved statically and are
  reported as WARNINGS with a file:line so they can be checked by hand.
  Warnings never fail the run. Unused catalogue keys are out of scope.

RECOGNISED CALLS
  t('key')  t("key")  t(`key`)  translate('key')  i18nKey="key"
  and the same with a namespace prefix, e.g. t('app:key') -- the prefix is
  stripped before the lookup.

USAGE
  ./scripts/check-i18n-usage.py apps/frontend/minerva-button
  ./scripts/check-i18n-usage.py apps/frontend/minerva-button -v
  ./scripts/check-i18n-usage.py apps/frontend/minerva-button -d en --json
  ./scripts/check-i18n-usage.py apps/frontend/minerva-button --include-tests

  -v / --verbose adds, for every unknown key, the line of code it came from and
  the closest existing keys ("did you mean"), and lists every literal key that
  did resolve with the places it is used.

EXIT CODES
  0  every literal key exists in the default catalogue
  1  at least one literal key is missing, the default catalogue is absent or did
     not parse, or a given path is not a directory / has no catalogues

JSON OUTPUT (--json)
  {
    "ok": bool,
    "default_language": str,
    "problems": [str],
    "projects": [{
      "project": str,
      "files_scanned": int,
      "known_keys": int,
      "missing": [{"key": str, "file": str, "line": int, "snippet": str}],
      "dynamic": [{"file": str, "line": int, "snippet": str}],
      "resolved": [{"key": str, "file": str, "line": int}]
    }]
  }
"""

SOURCE_SUFFIXES = {'.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs'}

#: `t('key')`, `translate("key")`, `i18nKey="key"` -- a literal key.
LITERAL_PATTERN = re.compile(
    r"""(?:\b(?:t|translate)\s*\(\s*(['"`])(?P<q>[^'"`${}\n]+)\1"""
    r"""|\bi18nKey\s*=\s*(?:(['"])(?P<a>[^'"\n]+)\3|\{\s*(['"`])(?P<b>[^'"`${}\n]+)\5\s*\}))""",
)

#: `t(variable)`, `t(`a${b}`)` -- a key that only exists at runtime.
DYNAMIC_PATTERN = re.compile(
    r"""\b(?:t|translate)\s*\(\s*(?!['"`]\s*\))(?:(?P<ident>[A-Za-z_$][\w$.\[\]'"]*\s*[,)])"""
    r"""|(?P<tpl>`[^`\n]*\$\{))""",
)


def source_files(root: Path, include_tests: bool) -> list[Path]:
    files: list[Path] = []

    for path in sorted(root.rglob('*')):
        if not path.is_file() or path.suffix not in SOURCE_SUFFIXES:
            continue
        if any(part in SKIP_DIRS or part.startswith('.') for part in path.relative_to(root).parts[:-1]):
            continue
        if not include_tests and re.search(r'\.(spec|test)\.[cm]?[jt]sx?$', path.name):
            continue
        files.append(path)

    return files


def known_keys_for(project, default_lang: str) -> tuple[set[str], list[str]]:
    """The set of keys the default language defines, with and without namespace."""
    keys: set[str] = set()
    errors: list[str] = []
    catalogues = project.by_language(default_lang)

    if not catalogues:
        errors.append(
            f'{relative(project.root)}: default language "{default_lang}" not found '
            f'(available: {", ".join(project.languages()) or "none"})'
        )
        return keys, errors

    for catalogue in catalogues:
        data, error = load_json(catalogue.path)

        if error is not None or not isinstance(data, dict):
            errors.append(f'{relative(catalogue.path)}: {error or "root is not an object"}')
            continue

        for key in flatten(data):
            keys.add(key)
            if catalogue.namespace:
                keys.add(f'{catalogue.namespace}:{key}')

    return keys, errors


def strip_namespace(key: str, known: set[str]) -> str:
    """Drops a leading `namespace:` when the bare key is the one we know."""
    if ':' in key and key not in known:
        return key.split(':', 1)[1]
    return key


def main() -> int:
    parser = build_parser(
        description='Check the source for translation keys missing from the default catalogue.',
        epilog=EPILOG,
    )
    parser.add_argument(
        '--include-tests',
        action='store_true',
        help='Also scan *.spec.* and *.test.* files (skipped by default).',
    )
    args = parser.parse_args()

    projects, problems = discover_projects(args.projects)

    report_projects: list[dict] = []
    lines: list[str] = [heading(f'Keys used in code  {paint("· default language: " + args.default_lang, "dim")}')]
    failed = False
    total_missing = 0
    total_dynamic = 0

    for project in projects:
        known, errors = known_keys_for(project, args.default_lang)
        problems.extend(errors)

        missing: list[dict] = []
        dynamic: list[dict] = []
        resolved: list[dict] = []
        files = source_files(project.root, args.include_tests)

        for path in files:
            try:
                text = path.read_text(encoding='utf-8')
            except (OSError, UnicodeDecodeError) as error:
                problems.append(f'{relative(path)}: cannot read file: {error}')
                continue

            for number, line in enumerate(text.splitlines(), start=1):
                snippet = line.strip()

                for match in LITERAL_PATTERN.finditer(line):
                    raw = match.group('q') or match.group('a') or match.group('b')
                    if raw is None:
                        continue
                    key = strip_namespace(raw, known)
                    if known and key not in known:
                        missing.append({'key': key, 'file': relative(path), 'line': number, 'snippet': snippet})
                    else:
                        resolved.append({'key': key, 'file': relative(path), 'line': number})

                for _ in DYNAMIC_PATTERN.finditer(line):
                    dynamic.append({'file': relative(path), 'line': number, 'snippet': snippet})

        lines.append(paint(relative(project.root), 'bold', 'cyan'))
        lines.append(paint(f'  {len(files)} source file(s) scanned  ·  {len(known)} key(s) in the catalogue', 'dim'))

        for error in errors:
            lines.append(f'  {paint(FAIL, "red")} {error}')

        if missing:
            lines.append(f'  {paint(FAIL, "red")} {paint(f"{len(missing)} unknown key(s)", "bold", "red")}')
            for item in missing:
                lines.append(f'      {paint(f"{item["file"]}:{item["line"]}", "dim")}')
                lines.append(f'        {paint(item["key"], "bold", "red")} is not in the catalogue')

                if not args.verbose:
                    continue

                lines.append(f'        {paint("code:", "dim")} {item["snippet"]}')
                close = difflib.get_close_matches(item['key'], sorted(known), n=3, cutoff=0.6)
                if close:
                    lines.append(f'        {paint("did you mean:", "dim")} {", ".join(close)}')

        if dynamic:
            lines.append(
                f'  {paint(WARN, "yellow")} '
                f'{paint(f"{len(dynamic)} dynamic lookup(s)", "bold", "yellow")}'
                f'{paint(" — cannot be checked statically, review by hand", "dim")}'
            )
            for item in dynamic:
                lines.append(f'      {paint(f"{item["file"]}:{item["line"]}", "dim")}')
                lines.append(f'        {item["snippet"]}')

        if not missing and not errors:
            detail = paint(f'  ({len(resolved)} literal lookup(s) resolved)', 'dim') if args.verbose else ''
            lines.append(f'  {paint(OK, "green")} {paint("every literal key exists", "green")}{detail}')

        if args.verbose and resolved:
            lines.append(paint('  literal keys found in the code:', 'dim'))
            for key in sorted({item['key'] for item in resolved}):
                where = [f'{item["file"]}:{item["line"]}' for item in resolved if item['key'] == key]
                lines.append(f'      {paint(OK, "green")} {key}  {paint(" ".join(where), "dim")}')

        total_missing += len(missing)
        total_dynamic += len(dynamic)
        failed = failed or bool(missing) or bool(errors)

        report_projects.append(
            {
                'project': relative(project.root),
                'files_scanned': len(files),
                'known_keys': len(known),
                'missing': missing,
                'dynamic': dynamic,
                'resolved': resolved,
            }
        )

    ok = not failed and not problems
    note = paint(f'  ({total_dynamic} dynamic lookup(s) to review)', 'dim') if total_dynamic else ''
    lines.append(rule())

    if ok:
        lines.append(f'{paint(OK, "green")} {paint("All referenced keys exist.", "bold", "green")}{note}')
    else:
        summary = f'{total_missing} referenced key(s) missing from the catalogue.'
        lines.append(f'{paint(FAIL, "red")} {paint(summary, "bold", "red")}{note}')

    emit(
        {'ok': ok, 'default_language': args.default_lang, 'problems': problems, 'projects': report_projects},
        args.as_json,
        lines,
    )
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
