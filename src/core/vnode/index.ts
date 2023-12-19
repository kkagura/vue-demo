import { RenderElement } from "../runtime/render";
import { ComponentInstance } from "../runtime/component";
import { TransitionHook } from "../runtime/Transition";

export interface VNodeProps {
  [key: string]: any;
}

export const Text = Symbol();
export const Fragment = Symbol();
export const Slot = "w:slot";

export interface VNode {
  type: string | Function | Symbol;
  props: VNodeProps | null;
  children: VNode[] | any;
  el: RenderElement | null;
  instance: ComponentInstance | null;
  readonly __vnode: true;
  transitionHook?: TransitionHook;
}
