"""
Shared helpers for the i18n check scripts.

Not meant to be run directly -- `check-i18n-json.py`, `check-i18n-keys.py` and
`check-i18n-usage.py` import it so they discover catalogues, flatten keys and
parse arguments in exactly the same way.

Requirements: Python 3 standard library only.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

# ---------- Config ----------

#: Directory names that never contain source catalogues or source code.
SKIP_DIRS = {'node_modules', 'dist', 'build', 'out', 'coverage', '.git', '.turbo', '.next', '.vite'}

#: Directory names that hold translation catalogues.
LOCALE_DIR_NAMES = {'locales', 'locale', 'lang', 'translations'}

#: Default reference language.
DEFAULT_LANGUAGE = 'en'


# ---------- Presentation ----------


def _colours_enabled() -> bool:
    """Colour unless the output is piped, NO_COLOR is set or a dumb terminal is in use."""
    if os.environ.get('NO_COLOR') is not None:
        return False
    if os.environ.get('FORCE_COLOR') is not None:
        return True
    return sys.stdout.isatty() and os.environ.get('TERM') != 'dumb'


COLOUR = _colours_enabled()

_CODES = {
    'reset': '\033[0m',
    'bold': '\033[1m',
    'dim': '\033[2m',
    'red': '\033[31m',
    'green': '\033[32m',
    'yellow': '\033[33m',
    'blue': '\033[34m',
    'cyan': '\033[36m',
}

#: Status icons. Plain enough to survive any terminal font.
OK = '✔'
WARN = '?'
FAIL = '✖'
INFO = '•'


def paint(text: str, *styles: str) -> str:
    """Wraps `text` in ANSI styles when colour is enabled."""
    if not COLOUR or not styles:
        return text
    return ''.join(_CODES[style] for style in styles if style in _CODES) + text + _CODES['reset']


def rule(char: str = '─') -> str:
    """A horizontal rule as wide as the terminal, capped at 80 columns."""
    columns = min(shutil.get_terminal_size((80, 24)).columns, 80)
    return paint(char * columns, 'dim')


def heading(text: str) -> str:
    """A section heading with a rule under it."""
    return f'\n{paint(text, "bold")}\n{rule()}'


# ---------- Data ----------


@dataclass
class Catalogue:
    """One translation file: a language, a namespace and the file behind them."""

    language: str
    namespace: str
    path: Path

    @property
    def label(self) -> str:
        return f'{self.language}/{self.namespace}' if self.namespace else self.language


@dataclass
class Project:
    """A project directory and every catalogue found beneath it."""

    root: Path
    locale_dirs: list[Path] = field(default_factory=list)
    catalogues: list[Catalogue] = field(default_factory=list)

    def languages(self) -> list[str]:
        return sorted({c.language for c in self.catalogues})

    def by_language(self, language: str) -> list[Catalogue]:
        return [c for c in self.catalogues if c.language == language]


# ---------- Discovery ----------


def _iter_dirs(root: Path):
    """Yields every directory under `root` (inclusive), skipping build output."""
    for dirpath, dirnames, _ in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.'))
        yield Path(dirpath)


def discover_project(root: Path) -> Project:
    """
    Finds the catalogues of a single project.

    Both layouts are supported and may be mixed:
      - one file per language:   `locales/en.json`      -> language `en`, namespace `''`
      - one folder per language: `locales/en/app.json`  -> language `en`, namespace `app`
    """
    project = Project(root=root)

    for directory in _iter_dirs(root):
        if directory.name not in LOCALE_DIR_NAMES:
            continue

        project.locale_dirs.append(directory)

        for entry in sorted(directory.iterdir()):
            if entry.is_file() and entry.suffix == '.json':
                project.catalogues.append(Catalogue(language=entry.stem, namespace='', path=entry))
            elif entry.is_dir() and entry.name not in SKIP_DIRS:
                for nested in sorted(entry.rglob('*.json')):
                    namespace = str(nested.relative_to(entry).with_suffix('')).replace(os.sep, '/')
                    project.catalogues.append(Catalogue(language=entry.name, namespace=namespace, path=nested))

    project.catalogues.sort(key=lambda c: (c.language, c.namespace))
    return project


def discover_projects(roots: list[str]) -> tuple[list[Project], list[str]]:
    """Returns the discovered projects plus a list of human-readable problems."""
    projects: list[Project] = []
    problems: list[str] = []

    for raw in roots:
        root = Path(raw).resolve()

        if not root.is_dir():
            problems.append(f'{raw}: not a directory')
            continue

        project = discover_project(root)

        if not project.catalogues:
            problems.append(f'{root}: no translation files found (looked for {"/".join(sorted(LOCALE_DIR_NAMES))})')

        projects.append(project)

    return projects, problems


# ---------- JSON ----------


def load_json(path: Path) -> tuple[object | None, str | None]:
    """Parses a JSON file. Returns `(data, None)` or `(None, error message)`."""
    try:
        text = path.read_text(encoding='utf-8')
    except OSError as error:
        return None, f'cannot read file: {error.strerror or error}'

    if not text.strip():
        return None, 'file is empty'

    try:
        return json.loads(text), None
    except json.JSONDecodeError as error:
        return None, f'invalid JSON: {error.msg} (line {error.lineno}, column {error.colno})'


def flatten(value: object, prefix: str = '') -> dict[str, object]:
    """
    Flattens a catalogue into dotted keys (`test.test.value`).

    Anything that is not a dict is a terminal value, so arrays and numbers count
    as translatable leaves just like strings do.
    """
    if not isinstance(value, dict):
        return {prefix: value}

    flat: dict[str, object] = {}

    for key, nested in value.items():
        path = f'{prefix}.{key}' if prefix else str(key)

        if isinstance(nested, dict) and nested:
            flat.update(flatten(nested, path))
        else:
            flat[path] = nested

    return flat


def unflatten(flat: dict[str, object]) -> dict:
    """Turns dotted keys back into a nested object. Inverse of `flatten`."""
    root: dict = {}

    for key, value in flat.items():
        parts = key.split('.')
        cursor = root

        for part in parts[:-1]:
            cursor = cursor.setdefault(part, {})

        cursor[parts[-1]] = value

    return root


def preview(value: object, limit: int = 300) -> str:
    """A one-line, quoted rendering of a source string for the verbose output."""
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
    text = ' '.join(text.split())

    if len(text) > limit:
        text = f'{text[: limit - 1]}…'

    return f'"{text}"'


def kind_of(value: object) -> str:
    """The value's shape, used to report mismatches between languages."""
    if isinstance(value, dict):
        return 'object'
    if isinstance(value, list):
        return 'array'
    if isinstance(value, bool):
        return 'boolean'
    if isinstance(value, (int, float)):
        return 'number'
    if value is None:
        return 'null'
    return 'string'


# ---------- CLI ----------


def build_parser(description: str, epilog: str, *, with_default_lang: bool = True) -> argparse.ArgumentParser:
    """Builds a parser carrying the flags every i18n script shares."""
    parser = argparse.ArgumentParser(
        description=description,
        epilog=epilog,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        'projects',
        nargs='+',
        metavar='PROJECT',
        help='One or more project directories to search for translation files (e.g. apps/frontend/minerva-button).',
    )

    if with_default_lang:
        parser.add_argument(
            '-d',
            '--default-lang',
            default=DEFAULT_LANGUAGE,
            metavar='LANG',
            help=f'The reference language every other language is compared against (default: {DEFAULT_LANGUAGE}).',
        )

    parser.add_argument(
        '-v',
        '--verbose',
        action='store_true',
        help=(
            'More detail in the human summary: every finding is listed in full (no truncation) and each missing key '
            'is shown together with its string in the default language, so it can be translated straight away.'
        ),
    )
    parser.add_argument(
        '--json',
        dest='as_json',
        action='store_true',
        help='Print machine-readable JSON on stdout instead of the human summary. Nothing else is written to stdout.',
    )
    return parser


def emit(payload: dict, as_json: bool, lines: list[str]) -> None:
    """Writes either the JSON payload or the human summary to stdout."""
    if as_json:
        print(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=False))
    else:
        print('\n'.join(lines))


def relative(path: Path) -> str:
    """A path relative to the current working directory when that is shorter."""
    try:
        return str(path.relative_to(Path.cwd()))
    except ValueError:
        return str(path)
