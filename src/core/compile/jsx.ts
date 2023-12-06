import { h } from "../h";
import { Fragment, Slot } from "../vnode";

export function createElement(
  comp: Function | string,
  props: Record<string, any> | null,
  ...children: any[]
) {
  children = children.flat().filter((el) => el !== null && el !== undefined);
  return h(comp, props, ...children);
}

export function createFragment() {}
