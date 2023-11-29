import { test, expect } from "vitest";
import { createReactive } from "../src/core/reactive";

test("reactive", () => {
  const [count, setCount] = createReactive(1);
  expect(count()).toBe(1);
  setCount(2);
  expect(count()).toBe(2);
});
