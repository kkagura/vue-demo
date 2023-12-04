import { h } from "../h";
import { Fragment } from "../vnode";

export function createElement(
  comp: Function | string,
  props: Record<string, any> | null,
  ...children: any[]
) {
  children = children.flat();
  return h(comp, props, ...children);
}

export function createFragment() {}
