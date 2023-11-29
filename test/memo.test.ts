import { test, expect, vi } from "vitest";
import { createReactive, createEffect, createMemo } from "../src/core/reactive";

test("memo", async () => {
  const [count, setCount] = createReactive(1);
  const memoFn = vi.fn(() => count() + 1);
  const memo = createMemo(memoFn);
  expect(memo()).toBe(2);
  expect(memoFn).toBeCalledTimes(1);
  setCount(10);
  expect(memoFn).toBeCalledTimes(1);
  expect(memo()).toBe(11);
  expect(memoFn).toBeCalledTimes(2);
  setCount(20);
  expect(memoFn).toBeCalledTimes(2);
  expect(memo()).toBe(21);
  expect(memoFn).toBeCalledTimes(3);

  const effectFn = vi.fn(() => memoFn());
  createEffect(effectFn);
  expect(effectFn).toBeCalledTimes(1);
  setCount(30);
  expect(effectFn).toBeCalledTimes(2);
});
