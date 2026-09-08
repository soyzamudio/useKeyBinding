"use client";

import { useEffect } from "react";

export type KeyBindingHandler = (event: KeyboardEvent) => void;

export interface KeyBindingOptions {
  /** Temporarily disable this binding. Default: true. */
  enabled?: boolean;
  /** Cancel the browser default after a match. Default: true. */
  preventDefault?: boolean;
  /** Allow shortcuts in inputs, textareas, selects and editable content. Default: false. */
  allowInInputs?: boolean;
  /** Fire while a key is held down. Default: false. */
  repeat?: boolean;
  /** Match physical KeyboardEvent.code values instead of key values. Default: false. */
  useCode?: boolean;
  /** Override automatic platform detection, for example in an embedded browser. */
  platform?: "mac" | "windows" | "linux";
}

type BindingArgs =
  | [...keys: string[], handler: KeyBindingHandler]
  | [...keys: string[], handler: KeyBindingHandler, options: KeyBindingOptions];

const aliases: Record<string, string> = {
  esc: "escape", space: " ", spacebar: " ", return: "enter",
  up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright",
};

function normalize(key: string): string {
  const lower = key === " " ? key : key.trim().toLowerCase();
  return aliases[lower] ?? lower;
}

function parse(keys: string[]) {
  const modifiers = { primary: false, ctrl: false, meta: false, alt: false, shift: false };
  let key: string | undefined;
  for (const token of keys) {
    const value = normalize(token);
    switch (value) {
      case "cmd": case "command": case "mod": modifiers.primary = true; break;
      case "ctrl": case "control": modifiers.ctrl = true; break;
      case "meta": modifiers.meta = true; break;
      case "alt": case "option": modifiers.alt = true; break;
      case "shift": modifiers.shift = true; break;
      default:
        if (!value || key !== undefined) {
          throw new Error("useKeyBinding expects modifiers and exactly one non-modifier key, passed as separate strings.");
        }
        key = value;
    }
  }
  if (key === undefined) throw new Error("useKeyBinding requires a non-modifier key.");
  return { ...modifiers, key };
}

function isEditable(event: KeyboardEvent): boolean {
  return event.composedPath().some((target) => {
    if (!(target instanceof HTMLElement)) return false;
    return /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      || target.isContentEditable
      || !!target.closest('[contenteditable]:not([contenteditable="false"]), [role="textbox"]');
  });
}

/** Bind modifiers and a key to a callback. `cmd` / `mod` means Command on Mac, Ctrl elsewhere. */
export function useKeyBinding(...args: BindingArgs): void {
  const last = args[args.length - 1];
  const hasOptions = typeof last !== "function";
  const options = (hasOptions ? last : {}) as KeyBindingOptions;
  const handler = args[args.length - (hasOptions ? 2 : 1)] as KeyBindingHandler;
  const keys = args.slice(0, args.length - (hasOptions ? 2 : 1));
  if (typeof handler !== "function" || !keys.every((key) => typeof key === "string")) {
    throw new Error("useKeyBinding expects key strings, a callback, and optional options.");
  }
  const { primary, ctrl, meta, alt, shift, key } = parse(keys as string[]);
  const { enabled = true, preventDefault = true, allowInInputs = false,
    repeat = false, useCode = false, platform } = options;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const mac = platform ? platform === "mac" : /Mac|iPhone|iPad|iPod/i.test(window.navigator.platform);
    const expectedCtrl = ctrl || (primary && !mac);
    const expectedMeta = meta || (primary && mac);

    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229
        || event.getModifierState("AltGraph") || (!repeat && event.repeat)
        || (!allowInInputs && isEditable(event))) return;
      if (event.ctrlKey !== expectedCtrl || event.metaKey !== expectedMeta
        || event.altKey !== alt || event.shiftKey !== shift) return;
      if (normalize(useCode ? event.code : event.key) !== key) return;
      if (preventDefault) event.preventDefault();
      handler(event);
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handler, enabled, preventDefault, allowInInputs, repeat, useCode, platform, primary, ctrl, meta, alt, shift, key]);
}
