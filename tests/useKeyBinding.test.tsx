import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { cleanup, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useKeyBinding } from "../src/index.js";

afterEach(() => { cleanup(); vi.restoreAllMocks(); document.body.innerHTML = ""; });

function press(init: KeyboardEventInit = {}, target: Window | Element = window) {
  const event = new KeyboardEvent("keydown", { key: "k", bubbles: true, cancelable: true, ...init });
  fireEvent(target, event);
  return event;
}

describe("useKeyBinding", () => {
  it.each(["MacIntel", "Win32", "Linux x86_64"])("detects %s", (platform) => {
    vi.spyOn(window.navigator, "platform", "get").mockReturnValue(platform);
    const handler = vi.fn();
    renderHook(() => useKeyBinding("cmd", "k", handler));
    press({ metaKey: true });
    press({ ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0][platform === "MacIntel" ? "metaKey" : "ctrlKey"]).toBe(true);
  });

  it.each(["mac", "windows", "linux"] as const)("overrides platform to %s", (platform) => {
    const handler = vi.fn();
    renderHook(() => useKeyBinding("mod", "k", handler, { platform }));
    expect(press({ metaKey: platform === "mac", ctrlKey: platform !== "mac" }).defaultPrevented).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("keeps literal modifiers and matches the whole chord", () => {
    const handler = vi.fn();
    renderHook(() => useKeyBinding("ctrl", "shift", "k", handler, { platform: "mac" }));
    press({ ctrlKey: true });
    press({ ctrlKey: true, shiftKey: true, altKey: true });
    press({ key: "K", ctrlKey: true, shiftKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("supports literal meta on Windows", () => {
    const handler = vi.fn();
    renderHook(() => useKeyBinding("meta", "k", handler, { platform: "windows" }));
    press({ ctrlKey: true });
    press({ metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it.each([["esc", "Escape"], ["space", " "], ["up", "ArrowUp"], ["+", "+"]])("supports %s", (binding, key) => {
    const handler = vi.fn();
    renderHook(() => useKeyBinding(binding, handler));
    press({ key });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it.each(["input", "textarea", "select", "editable", "textbox", "shadow"])("ignores typing in %s", (kind) => {
    const handler = vi.fn();
    renderHook(() => useKeyBinding("k", handler));
    const element = document.createElement(["input", "textarea", "select"].includes(kind) ? kind : "div");
    document.body.append(element);
    let target: Element = element;
    if (kind === "editable") {
      element.setAttribute("contenteditable", "true");
      target = element.appendChild(document.createElement("span"));
    }
    if (kind === "textbox") element.setAttribute("role", "textbox");
    if (kind === "shadow") target = element.attachShadow({ mode: "open" }).appendChild(document.createElement("input"));
    expect(press({ composed: true }, target).defaultPrevented).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it("allows opting into inputs and repeat without preventing default", () => {
    const handler = vi.fn();
    renderHook(() => useKeyBinding("k", handler, { allowInInputs: true, repeat: true, preventDefault: false }));
    const input = document.body.appendChild(document.createElement("input"));
    expect(press({ repeat: true }, input).defaultPrevented).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("ignores repeats, composition, AltGraph, and already handled events", () => {
    const handler = vi.fn();
    renderHook(() => useKeyBinding("k", handler));
    press({ repeat: true });
    press({ isComposing: true });
    press({ keyCode: 229 });
    const consumed = new KeyboardEvent("keydown", { key: "k", cancelable: true });
    consumed.preventDefault();
    fireEvent(window, consumed);
    const altGraph = new KeyboardEvent("keydown", { key: "k" });
    vi.spyOn(altGraph, "getModifierState").mockReturnValue(true);
    fireEvent(window, altGraph);
    expect(handler).not.toHaveBeenCalled();
  });

  it("uses physical codes when requested", () => {
    const handler = vi.fn();
    renderHook(() => useKeyBinding("KeyK", handler, { useCode: true }));
    press({ key: "x", code: "KeyK" });
    press({ key: "k", code: "KeyX" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("updates callbacks, keys and options after rendering", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(({ value, key, enabled }) => {
      useKeyBinding(key, () => handler(value), { enabled });
    }, { initialProps: { value: 1, key: "k", enabled: true } });
    press();
    rerender({ value: 2, key: "j", enabled: true });
    press();
    press({ key: "j" });
    rerender({ value: 3, key: "j", enabled: false });
    press({ key: "j" });
    expect(handler.mock.calls).toEqual([[1], [2]]);
  });

  it("cleans up on unmount and under Strict Mode", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyBinding("k", handler), { wrapper: StrictMode });
    press();
    expect(handler).toHaveBeenCalledTimes(1);
    unmount();
    press();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("rejects ambiguous and missing keys", () => {
    function Invalid({ keys }: { keys: string[] }) {
      useKeyBinding(...keys, () => {});
      return null;
    }
    expect(() => renderToString(<Invalid keys={["cmd"]} />)).toThrow("non-modifier key");
    expect(() => renderToString(<Invalid keys={["k", "j"]} />)).toThrow("exactly one");
  });
});
