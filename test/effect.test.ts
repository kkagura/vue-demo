import { test, expect, vi } from "vitest";
import { createReactive, createEffect } from "../src/core/reactive";
import { queueJob } from "../src/core/scheduler";

test("effect", () => {
  const [count, setCount] = createReactive(1);
  const getCount = vi.fn(() => count());
  createEffect(getCount);
  expect(getCount).toHaveBeenCalledTimes(1);
  setCount(2);
  setCount(3);
  expect(getCount).toHaveBeenCalledTimes(3);
});

test("scheduler", async () => {
  const [count, setCount] = createReactive(1);
  const getCount = vi.fn(() => count());
  createEffect(getCount, {
    scheduler: queueJob,
  });
  expect(getCount).toHaveBeenCalledTimes(1);
  setCount(2);
  setCount(3);
  expect(getCount).toHaveBeenCalledTimes(1);
  Promise.resolve().then(() => {
    expect(getCount).toHaveBeenCalledTimes(2);
  });
});
