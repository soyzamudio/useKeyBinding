// @vitest-environment node
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { useKeyBinding } from "../src/index.js";

it("renders without browser globals", () => {
  function Component() {
    useKeyBinding("cmd", "k", () => {});
    return <span>Ready</span>;
  }
  expect(typeof window).toBe("undefined");
  expect(renderToString(<Component />)).toBe("<span>Ready</span>");
});
