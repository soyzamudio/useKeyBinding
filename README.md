# useKeyBinding

A small React hook for keyboard shortcuts on macOS, Windows, and Linux. TypeScript included, MIT licensed, with no runtime dependencies beyond React.

```tsx
import { useState } from "react";
import { useKeyBinding } from "use-key-binding";

export function CommandMenu() {
  const [open, setOpen] = useState(false);

  useKeyBinding("cmd", "k", () => setOpen(value => !value));
  useKeyBinding("esc", () => setOpen(false), { enabled: open });

  return (
    <>
      <button onClick={() => setOpen(value => !value)}>Toggle commands</button>
      {open && <div>Put your command menu here.</div>}
    </>
  );
}
```

`cmd` means **Command on Mac** and **Ctrl on Windows/Linux**. `mod` and `command` are aliases. Use `meta` for the literal Command/Windows key, and `ctrl` for literal Control on every platform.

## Installation

```sh
npm install use-key-binding
```

Requires React 18 or later and an ESM-compatible bundler.

### Local installation

To build and install from a checkout:

```sh
npm install
npm test
npm run typecheck
npm pack
# From your React app, use the actual path to the generated archive:
npm install /path/to/use-key-binding-0.1.0.tgz
```

## API

```tsx
useKeyBinding(...keys, callback, options?);

useKeyBinding("cmd", "shift", "p", event => { /* open palette */ });
useKeyBinding("alt", "ArrowDown", event => { /* move selection */ });
useKeyBinding("ctrl", "k", event => { /* literal Ctrl+K */ });
useKeyBinding("cmd", "KeyK", event => { /* physical K position */ }, { useCode: true });
```

Pass each modifier and exactly one key as separate strings. The hook returns `void`. Key names are case insensitive and use `KeyboardEvent.key` by default. Common aliases include `esc`, `space`, `return`, and `up`/`down`/`left`/`right`. Modifier aliases include `control` and `option`.

Matching is exact: an extra Shift, Alt, Ctrl, or Meta modifier prevents a match. For a shifted character, include `shift` explicitly, for example `useKeyBinding("shift", "?", callback)` on a US layout. Actual characters depend on the keyboard layout; `useCode` binds a physical position instead. See [KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).

| Option | Default | Behavior |
| --- | --- | --- |
| `enabled` | `true` | Enable or disable the binding. |
| `preventDefault` | `true` | Cancel the browser action on a match. |
| `allowInInputs` | `false` | Enable in inputs, textareas, selects, editable content, and ARIA textboxes. |
| `repeat` | `false` | Enable repeated events when holding a key. |
| `useCode` | `false` | Match `KeyboardEvent.code` instead of `key`. |
| `platform` | auto-detected | Override with `"mac"`, `"windows"`, or `"linux"`. |

Listeners run on `window` in the bubble phase and are removed on unmount. Callbacks receive current render values; you do not need a dependency array. Registration and cleanup follow [React’s Effect lifecycle](https://react.dev/reference/react/useEffect). Server rendering is supported, and the entry point includes `"use client"` for React Server Component environments.

Composition/IME events, AltGraph, and events already prevented by another handler are ignored. With the default `preventDefault: true`, the first matching listener handles a shortcut; there is no priority or scope manager. Setting `preventDefault: false` lets additional matching listeners run.

Shortcuts work while the page has focus and the browser delivers the event. OS-reserved shortcuts and some browser shortcuts cannot be intercepted. Keep a visible button or menu action for keyboard shortcuts, and take care with single-letter shortcuts and assistive technology. The example above illustrates the hook; it is not a complete accessible dialog.

For example, bind Command+Option+Shift+K by physical position so an Option-generated symbol does not prevent a match:

```tsx
useKeyBinding("cmd", "option", "shift", "KeyK", callback, { useCode: true });
```

## Contributing

Use a current Node.js LTS release. Install dependencies with `npm ci`, make your change, then run `npm test`, `npm run typecheck`, and `npm run build`. Include a regression test for behavior changes. Tests simulate each platform; native browser/OS testing is still useful before a release.

### Publishing

From a clean checkout with dependencies installed:

```sh
npm login --registry=https://registry.npmjs.org/
npm publish --dry-run
npm publish
```

Publishing runs tests and type checking, then builds the package. Only `dist`, the README, the license, and package metadata are included. Complete any npm authentication prompts. For later releases, update the version before publishing; npm versions cannot be reused.

## License

[MIT](./LICENSE)
