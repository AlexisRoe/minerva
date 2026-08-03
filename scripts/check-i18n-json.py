#!/usr/bin/env python3
"""
check-i18n-json.py

Checks that every translation file found in the given projects is valid JSON.

Requirements: Python 3 standard library only.
Usage:        ./scripts/check-i18n-json.py PROJECT [PROJECT ...] [--json]
Output:       one line per file (human), or a JSON report with `--json`.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from i18n_common import (  # noqa: E402
    FAIL,
    OK,
    discover_projects,
    emit,
    flatten,
    heading,
    kind_of,
    load_json,
    paint,
    relative,
    rule,
)

EPILOG = """\
For an AI agent
---------------
WHAT IT DOES
  Finds every translation catalogue under the given project directories and
  parses it. Reports a syntax error, an empty file or a non-object root as a
  failure. It says nothing about which keys exist -- use check-i18n-keys.py for
  that. Run this first: the other scripts skip files that do not parse.

DISCOVERY
  A catalogue is any .json file inside a directory named locales/, locale/,
  lang/ or translations/. Both layouts work:
    locales/en.json        -> language "en"
    locales/en/app.json    -> language "en", namespace "app"
  node_modules, dist, build and dot-directories are never searched.

USAGE
  ./scripts/check-i18n-json.py apps/frontend/minerva-button
  ./scripts/check-i18n-json.py apps/frontend/minerva-button -v
  ./scripts/check-i18n-json.py apps/frontend/minerva-button apps/frontend/minerva-manager --json

  -v / --verbose adds the key count, language and namespace of every valid file.

EXIT CODES
  0  every file parsed
  1  at least one file is invalid, or a given path is not a directory / has no catalogues

JSON OUTPUT (--json)
  {
    "ok": bool,                       # true when every file parsed
    "checked": int,                   # number of files parsed
    "problems": [str],                # discovery problems (bad path, no catalogues found)
    "files": [
      {"project": str, "path": str, "language": str, "namespace": str,
       "valid": bool, "error": str|null}
    ]
  }
"""


def main() -> int:
    from i18n_common import build_parser

    args = build_parser(
        description='Check that all i18n translation JSON files parse.',
        epilog=EPILOG,
        with_default_lang=False,
    ).parse_args()

    projects, problems = discover_projects(args.projects)

    files: list[dict] = []
    lines: list[str] = []
    invalid = 0

    lines.append(heading('JSON syntax'))

    for project in projects:
        lines.append(paint(relative(project.root), 'bold', 'cyan'))

        if not project.catalogues:
            lines.append(f'  {paint(FAIL, "red")} no translation files found')
            continue

        for locale_dir in project.locale_dirs:
            in_dir = [c for c in project.catalogues if c.path.is_relative_to(locale_dir)]

            if not in_dir:
                continue

            lines.append(f'  {paint(relative(locale_dir) + "/", "dim")}')

            for catalogue in in_dir:
                data, error = load_json(catalogue.path)

                if error is None and not isinstance(data, dict):
                    error = f'root must be an object, found {kind_of(data)}'

                name = str(catalogue.path.relative_to(locale_dir))
                files.append(
                    {
                        'project': relative(project.root),
                        'path': relative(catalogue.path),
                        'language': catalogue.language,
                        'namespace': catalogue.namespace,
                        'valid': error is None,
                        'error': error,
                    }
                )

                if error is None:
                    detail = ''
                    if args.verbose:
                        detail = paint(f'  ({len(flatten(data))} key(s), language {catalogue.language}'
                                       f'{", namespace " + catalogue.namespace if catalogue.namespace else ""})', 'dim')
                    lines.append(f'    {paint(OK, "green")} {name}{detail}')
                else:
                    invalid += 1
                    lines.append(f'    {paint(FAIL, "red")} {paint(name, "bold")}')
                    lines.append(f'      {paint(error, "red")}')

    if problems:
        lines.append('')
        for problem in problems:
            lines.append(f'{paint(FAIL, "red")} {problem}')

    ok = invalid == 0 and not problems
    lines.append(rule())

    if not files:
        lines.append(f'{paint(FAIL, "red")} No files checked.')
    elif ok:
        lines.append(f'{paint(OK, "green")} {paint(f"All {len(files)} file(s) are valid JSON.", "bold", "green")}')
    else:
        lines.append(f'{paint(FAIL, "red")} {paint(f"{invalid} of {len(files)} file(s) invalid.", "bold", "red")}')

    emit({'ok': ok, 'checked': len(files), 'problems': problems, 'files': files}, args.as_json, lines)
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
