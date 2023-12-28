import {
  Move,
  Patch,
  PatchChildren,
  RenderContext,
  RenderElement,
  RenderOptions,
  Unmount,
} from "./render";
import { ReactiveEffect, Reader, Writer } from "../reactive";
import { VNode } from "../vnode";
import { AppContext } from "../app";
import { Provides } from "./inject";
export interface ComponentInstance<Props = any> {
  effectState: ReactiveEffect | null;
  propState: {
    props: Reader<Props>;
    setProps: Writer<Props>;
  };
  subtree: VNode | null;
  vnode: VNode;
  update: Function;
  parent: ComponentInstance | null;
  appContext: AppContext;
  provides: Provides;
}

export interface ComponentProcess {
  (
    n1: VNode | null,
    n2: VNode | null,
    container: RenderElement,
    parentComponent: ComponentInstance | null,
    internals: {
      patch: Patch;
      patchChildren: PatchChildren;
      unmount: Unmount;
      move: Move;
      nodeOps: RenderOptions;
    }
  ): void;
}
export interface Component<T> {
  (props: T): (context: RenderContext) => JSX.IntrinsicElements;
  process?: ComponentProcess;
}

let currentInstance: ComponentInstance | null = null;

export function getCurrentInstance<Props>() {
  return currentInstance as ComponentInstance<Props> | null;
}

export function setCurrentInstance(instance: ComponentInstance | null) {
  currentInstance = instance;
}

export function useEmit<T = any>(): T {
  if (!currentInstance) {
    throw new Error("当前实例不存在");
  }
  const instance = currentInstance;
  const emit = ((event: string, payload: any) => {
    const propName = "on" + event.slice(0, 1).toUpperCase() + event.slice(1);
    const props = instance.propState.props();
    const eventHandler = props?.[propName];
    if (eventHandler) {
      eventHandler(payload);
    }
  }) as unknown as T;
  return emit;
}
