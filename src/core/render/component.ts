import { RenderContext } from ".";
import { ReactiveEffect, Reader, Writer } from "../reactive";
import { VNode } from "../vnode";
export interface ComponentInstance<Props = any> {
  effectState: ReactiveEffect | null;
  propState: {
    props: Props;
    setProps: Writer<Props>;
  };
  subtree: VNode | null;
}

export type Component<T> = (
  props: T
) => (context: RenderContext) => JSX.IntrinsicElements;

let currentInstance: ComponentInstance | null = null;

export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance: ComponentInstance | null) {
  currentInstance = instance;
}

export function useEmit<T = any>(): T {
  if (!currentInstance) {
    throw new Error("当前实例不存在");
  }
  const instance = currentInstance;
  const emit = ((event: any, payload: any) => {
    const eventHandler = instance.propState.props?.[event];
    if (eventHandler) {
      eventHandler(payload);
    }
  }) as unknown as T;
  return emit;
}
