# shared

Packages used by more than one part of Minerva.

## [ui-lib](./ui-lib/README.md)

`@minerva/ui-lib` — the shared UI layer. It holds every component the apps draw
with, the Mantine theme they are drawn in, and the entry points through which the
apps reach Mantine and the icon set. The only package that depends on Mantine and
Tabler directly, so both apps look like the same product and there is one React
and one Mantine at runtime.
