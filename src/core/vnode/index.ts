import { RenderElement } from "../render";
import { ReactiveEffect } from "../reactive";

export interface VNodeProps {
  [key: string]: any;
}

export const Text = Symbol();

export interface ComponentInstance {
  effectState: ReactiveEffect | null;
  propState: {
    props: any;
    setProps: Function;
  };
  subtree: VNode | null;
}

export interface VNode {
  type: string | Function | Symbol;
  props: VNodeProps | null;
  children: VNode[] | any;
  el: RenderElement | null;
  instance: ComponentInstance | null;
  readonly __vnode: true;
}
