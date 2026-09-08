import { cleanup, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { getDemoBinding } from "../demo/binding.js";
import { useKeyBinding } from "../src/index.js";

afterEach(cleanup);

it.each(["", "˚", "Dead"])("matches Cmd+Option+Shift+K when the character is %s", key => {
  const binding = getDemoBinding(["cmd", "alt", "shift", "k"]);
  const handler = vi.fn();
  renderHook(() => useKeyBinding(...binding.keys, handler, { useCode: binding.useCode, platform: "mac" }));
  const event = new KeyboardEvent("keydown", {
    key, code: "KeyK", metaKey: true, altKey: true, shiftKey: true, cancelable: true,
  });
  fireEvent(window, event);
  expect(handler).toHaveBeenCalledWith(event);
  expect(event.defaultPrevented).toBe(true);
});

it("still requires the exact physical key and every modifier", () => {
  const binding = getDemoBinding(["cmd", "option", "shift", "k"]);
  const handler = vi.fn();
  renderHook(() => useKeyBinding(...binding.keys, handler, { useCode: binding.useCode, platform: "mac" }));
  for (const change of [{ code: "KeyJ" }, { metaKey: false }, { altKey: false }, { shiftKey: false }, { ctrlKey: true }, { isComposing: true }]) {
    fireEvent(window, new KeyboardEvent("keydown", {
      key: "", code: "KeyK", metaKey: true, altKey: true, shiftKey: true, ...change,
    }));
  }
  expect(handler).not.toHaveBeenCalled();
});

it("matches Option+digit when the produced character is a symbol", () => {
  const binding = getDemoBinding(["option", "2"]);
  const handler = vi.fn();
  renderHook(() => useKeyBinding(...binding.keys, handler, { useCode: binding.useCode, platform: "mac" }));
  fireEvent(window, new KeyboardEvent("keydown", { key: "™", code: "Digit2", altKey: true }));
  expect(handler).toHaveBeenCalledTimes(1);
});

it("switches back to character matching when Option is removed", () => {
  const handler = vi.fn();
  const { rerender } = renderHook(({ keys }) => {
    const binding = getDemoBinding(keys);
    useKeyBinding(...binding.keys, handler, { useCode: binding.useCode, platform: "mac" });
  }, { initialProps: { keys: ["cmd", "alt", "shift", "k"] } });
  rerender({ keys: ["cmd", "shift", "k"] });
  fireEvent(window, new KeyboardEvent("keydown", { key: "", code: "KeyK", metaKey: true, altKey: true, shiftKey: true }));
  expect(handler).not.toHaveBeenCalled();
  fireEvent(window, new KeyboardEvent("keydown", { key: "K", code: "KeyK", metaKey: true, shiftKey: true }));
  expect(handler).toHaveBeenCalledTimes(1);
});

it.each([["alt", "enter"], ["alt", "arrowdown"], ["alt", "shift", "?"], ["cmd", "k"]])("preserves character matching for %j", (...keys) => {
  expect(getDemoBinding(keys)).toEqual({ keys, useCode: false });
});
