import { VNode, Text, Slot } from "../vnode";

export function h(
  comp: Function | string | Symbol,
  props: Record<string, any> | null,
  ...children: any[]
): VNode {
  children = children.flat().map((el) => {
    if (typeof el === "object") {
      return el;
    } else {
      return {
        props: null,
        type: Text,
        children: el,
        el: null,
        __vnode: true,
      };
    }
  });
  return {
    props: props || {},
    type: comp,
    children,
    el: null,
    __vnode: true,
    instance: null,
  };
}
