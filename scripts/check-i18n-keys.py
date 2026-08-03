#!/usr/bin/env python3
"""
check-i18n-keys.py

Compares every language against the default language and reports missing keys
(present in the default catalogue, absent here) and stale keys (the other way
round), including deeply nested keys such as `test.test.value`.

Requirements: Python 3 standard library only.
Usage:        ./scripts/check-i18n-keys.py PROJECT [PROJECT ...] [-d en] [--json]
Output:       one line per language (human), or a JSON report with `--json`.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from i18n_common import (  # noqa: E402
    FAIL,
    OK,
    WARN,
    build_parser,
    discover_projects,
    emit,
    flatten,
    heading,
    kind_of,
    load_json,
    paint,
    preview,
    relative,
    rule,
)

EPILOG = """\
For an AI agent
---------------
WHAT IT DOES
  Flattens the default language's catalogue into dotted keys and compares every
  other language against it, per namespace. For each language it reports
  "valid", or how many keys are MISSING (need translating) and how many are
  STALE (should be removed), plus type mismatches (e.g. object here, string in
  the default language).

  With --json every missing key comes with the default language's source string,
  so one run gives you everything needed to produce the translations.

USAGE
  ./scripts/check-i18n-keys.py apps/frontend/minerva-button
  ./scripts/check-i18n-keys.py apps/frontend/minerva-button -v
  ./scripts/check-i18n-keys.py apps/frontend/minerva-button -d en --json
  ./scripts/check-i18n-keys.py apps/frontend/minerva-button --fail-on missing

  Plain output lists at most 20 missing and 20 stale keys per language, by name
  only. -v / --verbose lists them all and prints each missing key together with
  its string in the default language (and each stale key with its current
  string), which is what you want when the next step is translating. --json
  carries the same information in machine-readable form.

EXIT CODES
  0  every language passes the --fail-on criterion
  1  something failed it, the default language is absent, a file did not parse,
     or a given path is not a directory / has no catalogues

JSON OUTPUT (--json)
  {
    "ok": bool,
    "default_language": str,
    "fail_on": "any"|"missing"|"stale",
    "problems": [str],
    "projects": [{
      "project": str,
      "namespaces": [{
        "namespace": str,
        "default_path": str,
        "key_count": int,                  # keys in the default catalogue
        "languages": [{
          "language": str,
          "path": str,
          "status": "valid"|"incomplete"|"error",
          "error": str|null,
          "missing_count": int,
          "stale_count": int,
          "missing": {"<dotted.key>": "<source string in the default language>"},
          "stale": ["<dotted.key>"],
          "type_mismatch": [{"key": str, "expected": str, "found": str}]
        }]
      }]
    }]
  }
"""


def main() -> int:
    parser = build_parser(
        description='Check every language for missing or stale translation keys.',
        epilog=EPILOG,
    )
    parser.add_argument(
        '--fail-on',
        choices=('any', 'missing', 'stale'),
        default='any',
        help='Which findings make the script exit 1 (default: any).',
    )
    args = parser.parse_args()

    projects, problems = discover_projects(args.projects)
    default_lang = args.default_lang

    report_projects: list[dict] = []
    lines: list[str] = [heading(f'Translation keys  {paint("· default language: " + default_lang, "dim")}')]
    failed = False
    complete = 0
    incomplete = 0

    for project in projects:
        lines.append(paint(relative(project.root), 'bold', 'cyan'))
        namespaces: list[dict] = []

        if not project.catalogues:
            continue

        default_catalogues = project.by_language(default_lang)

        if not default_catalogues:
            problems.append(
                f'{relative(project.root)}: default language "{default_lang}" not found '
                f'(available: {", ".join(project.languages()) or "none"})'
            )
            lines.append(f'  {paint(FAIL, "red")} default language "{default_lang}" not found')
            continue

        for default_catalogue in default_catalogues:
            namespace = default_catalogue.namespace
            data, error = load_json(default_catalogue.path)

            if error is not None or not isinstance(data, dict):
                message = error or 'root is not an object'
                problems.append(f'{relative(default_catalogue.path)}: {message}')
                lines.append(f'  {paint(FAIL, "red")} {relative(default_catalogue.path)}: {paint(message, "red")}')
                continue

            reference = flatten(data)
            language_reports: list[dict] = []

            label = f'namespace {namespace}' if namespace else f'{relative(default_catalogue.path.parent)}/'
            lines.append(paint(f'  {label}  ·  {len(reference)} key(s) in {default_lang}', 'dim'))

            for catalogue in project.catalogues:
                if catalogue.language == default_lang or catalogue.namespace != namespace:
                    continue

                entry: dict = {
                    'language': catalogue.language,
                    'path': relative(catalogue.path),
                    'status': 'valid',
                    'error': None,
                    'missing_count': 0,
                    'stale_count': 0,
                    'missing': {},
                    'stale': [],
                    'type_mismatch': [],
                }

                tag = paint(catalogue.language.ljust(4), 'bold')
                other, other_error = load_json(catalogue.path)

                if other_error is not None or not isinstance(other, dict):
                    entry['status'] = 'error'
                    entry['error'] = other_error or 'root is not an object'
                    lines.append(f'    {paint(FAIL, "red")} {tag}  unreadable')
                    lines.append(f'        {paint(entry["error"], "red")}')
                    language_reports.append(entry)
                    incomplete += 1
                    failed = True
                    continue

                flat = flatten(other)

                missing = {key: reference[key] for key in reference if key not in flat}
                stale = [key for key in flat if key not in reference]
                mismatch = [
                    {'key': key, 'expected': kind_of(reference[key]), 'found': kind_of(flat[key])}
                    for key in reference
                    if key in flat and kind_of(reference[key]) != kind_of(flat[key])
                ]

                entry['missing'] = missing
                entry['stale'] = stale
                entry['type_mismatch'] = mismatch
                entry['missing_count'] = len(missing)
                entry['stale_count'] = len(stale)

                relevant = {
                    'any': bool(missing) or bool(stale) or bool(mismatch),
                    'missing': bool(missing) or bool(mismatch),
                    'stale': bool(stale) or bool(mismatch),
                }[args.fail_on]

                if missing or stale or mismatch:
                    entry['status'] = 'incomplete'
                    icon = paint(FAIL, 'red') if relevant else paint(WARN, 'yellow')
                    parts = []
                    if missing:
                        parts.append(paint(f'{len(missing)} missing', 'red'))
                    if stale:
                        parts.append(paint(f'{len(stale)} stale', 'yellow'))
                    if mismatch:
                        parts.append(paint(f'{len(mismatch)} type mismatch', 'red'))
                    lines.append(f'    {icon} {tag}  {paint(" · ", "dim").join(parts)}')

                    limit = None if args.verbose else 20

                    for key in list(missing)[:limit]:
                        lines.append(f'        {paint("missing", "red")}  {key}')
                        if args.verbose:
                            lines.append(f'                 {paint(default_lang + ":", "dim")} {preview(missing[key])}')
                    if limit and len(missing) > limit:
                        lines.append(paint(f'        … and {len(missing) - limit} more missing (-v to list them)', 'dim'))

                    for key in stale[:limit]:
                        lines.append(f'        {paint("stale  ", "yellow")}  {key}')
                        if args.verbose:
                            lines.append(f'                 {paint("only in " + catalogue.language, "dim")} {preview(flat[key])}')
                    if limit and len(stale) > limit:
                        lines.append(paint(f'        … and {len(stale) - limit} more stale (-v to list them)', 'dim'))
                    for item in mismatch:
                        detail = paint(f'(expected {item["expected"]}, found {item["found"]})', 'dim')
                        lines.append(f'        {paint("type   ", "red")}  {item["key"]} {detail}')
                    incomplete += 1
                else:
                    detail = paint(f'  ({len(reference)} key(s))', 'dim') if args.verbose else ''
                    lines.append(f'    {paint(OK, "green")} {tag}  {paint("complete", "green")}{detail}')
                    complete += 1

                failed = failed or relevant
                language_reports.append(entry)

            namespaces.append(
                {
                    'namespace': namespace,
                    'default_path': relative(default_catalogue.path),
                    'key_count': len(reference),
                    'languages': language_reports,
                }
            )

        report_projects.append({'project': relative(project.root), 'namespaces': namespaces})

    extra = [problem for problem in problems if 'not found' not in problem]

    if extra:
        lines.append('')
        for problem in extra:
            lines.append(f'{paint(FAIL, "red")} {problem}')

    ok = not failed and not problems
    lines.append(rule())

    if ok:
        summary = f'All {complete} language(s) are complete.'
        lines.append(f'{paint(OK, "green")} {paint(summary, "bold", "green")}')
    else:
        summary = f'{incomplete} of {complete + incomplete} language(s) need attention.'
        lines.append(f'{paint(FAIL, "red")} {paint(summary, "bold", "red")}')
        if not args.verbose:
            lines.append(paint('  Re-run with -v (or --json) to see every key plus its source string.', 'dim'))

    emit(
        {
            'ok': ok,
            'default_language': default_lang,
            'fail_on': args.fail_on,
            'problems': problems,
            'projects': report_projects,
        },
        args.as_json,
        lines,
    )
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
