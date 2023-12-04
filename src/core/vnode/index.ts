import { RenderElement } from "../render";
import { ReactiveEffect } from "../reactive";
import { ComponentInstance } from "../render/component";

export interface VNodeProps {
  [key: string]: any;
}

export const Text = Symbol();
export const Fragment = Symbol();

export interface VNode {
  type: string | Function | Symbol;
  props: VNodeProps | null;
  children: VNode[] | any;
  el: RenderElement | null;
  instance: ComponentInstance | null;
  readonly __vnode: true;
}
