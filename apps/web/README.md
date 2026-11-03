# AirConsole web application

This is the shared multi-page Vite project for the TV/desktop console and the
mobile controller.

## Entry points

- `/console/` loads `src/console/main.tsx`.
- `/controller/` loads `src/controller/main.tsx`.

The production build emits both entry points while keeping their application
module graphs separate. Code in `src/shared` is reserved for modules that are
used by both surfaces.

## Source boundaries

- `src/console`: console components, features, pages, and state.
- `src/controller`: controller components, features, pages, and state.
- `src/shared`: shared accessibility, components, and configuration.
- `tests/console`: console unit, component, and accessibility tests.
- `tests/controller`: controller unit, component, and accessibility tests.
- `tests/shared`: tests for shared web modules.

Console code must not import controller code, and controller code must not
import console code.

## Commands

```sh
npm run dev
npm run build
npm run lint
npm test
```

## Styling

Tailwind CSS is available in both application entry points through
`src/shared/styles/tailwind.css`. Tailwind v4 theme tokens are configured in
that stylesheet and exposed as utilities such as `bg-air-background`,
`text-air-foreground`, and `outline-air-focus`.

Keep utility class names complete and statically detectable. For variants,
map application state to full class names instead of constructing partial
class names dynamically.
