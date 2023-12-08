import { RenderContext } from ".";
import { ReactiveEffect, Reader, Writer } from "../reactive";
import { VNode } from "../vnode";
export interface ComponentInstance<Props = any> {
  effectState: ReactiveEffect | null;
  propState: {
    props: Reader<Props>;
    setProps: Writer<Props>;
  };
  subtree: VNode | null;
  vnode: VNode;
}

export type Component<T> = (
  props: T
) => (context: RenderContext) => JSX.IntrinsicElements;

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
