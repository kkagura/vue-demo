import { RenderElement } from "../runtime/render";
import { Component, ComponentInstance } from "../runtime/component";
import { TransitionHook } from "../runtime/Transition";
import { App } from "../app";

export interface VNodeProps {
  [key: string]: any;
}

export const Text = Symbol();
export const Fragment = Symbol();
export const Slot = "w:slot";

export interface VNode {
  type: string | Symbol | Component<unknown>;
  props: VNodeProps | null;
  children: VNode[] | any;
  el: RenderElement | null;
  instance: ComponentInstance | null;
  readonly __vnode: true;
  transitionHook?: TransitionHook;
}
