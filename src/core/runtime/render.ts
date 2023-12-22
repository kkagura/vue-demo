import { AppContext } from "../app";
import { h } from "../h";
import { createEffect, createReactive } from "../reactive";
import { queueJob } from "../scheduler";
import { Slot, Text, VNode, VNodeProps } from "../vnode";
import { ComponentInstance, setCurrentInstance } from "./component";
const svgNS = "http://www.w3.org/2000/svg";
const xlinkNS = "http://www.w3.org/1999/xlink";

export interface RenderNode {
  [key: string]: any;
}

export interface RenderElement extends RenderNode {}

export interface RenderOptions<
  HostNode = RenderNode,
  HostElement = RenderElement
> {
  remove(el: HostNode): void;
  insert(el: HostNode, container: HostElement, anchor?: HostNode | null): void;
  createElement(type: string, isSvg: boolean): HostElement;
  createText(text: string): HostNode;
  createComment(comment: string): HostNode;
  setText(node: HostNode, text: string): void;
  patchProp(el: HostElement, key: string, newValue: any, isSvg: boolean): void;
}

export interface RenderContext {
  slots: Record<string, (scope: any) => any>;
  renderSlot: (slotName: string, defaultNode?: any, scope?: any) => any;
}

export function render(
  vnode: VNode | null,
  container: RenderElement,
  appContext: AppContext,
  options: RenderOptions
) {
  const { patchProp, insert, remove, createElement, createText, setText } =
    options;
  function unmount(vnode: VNode) {
    if (vnode.instance?.subtree) {
      unmount(vnode.instance.subtree);
      return;
    }
    const el = vnode.el;
    if (el) {
      const performanceRemove = () => {
        remove(el);
      };
      const { transitionHook } = vnode;
      if (transitionHook) {
        transitionHook.leave(el, performanceRemove);
      } else {
        performanceRemove();
      }
    }
  }

  function patchProps(
    el: RenderElement,
    oldProps: VNodeProps | null,
    newProps: VNodeProps | null,
    isSvg: boolean
  ) {
    oldProps = oldProps || {};
    newProps = newProps || {};
    for (const key in newProps) {
      const newVal = newProps[key];
      const oldVal = oldProps[key];
      if (newVal !== oldVal) {
        patchProp(el, key, newVal, isSvg);
      }
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        patchProp(el, key, null, isSvg);
      }
    }
  }

  function isSameVNode(n1: VNode, n2: VNode) {
    return n1.type === n2.type;
  }

  function patchChildren(
    container: RenderElement,
    n1: VNode,
    n2: VNode,
    parentComponent: ComponentInstance | null,
    isSvg: boolean
  ) {
    if (!Array.isArray(n1.children)) {
      if (Array.isArray(n2.children)) {
        setText(container, "");
        n2.children.forEach((child) =>
          patch(null, child, container, parentComponent, isSvg)
        );
      } else {
        setText(container, n2.children.toString());
      }
    } else if (!Array.isArray(n2.children)) {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => unmount(child));
      }
      setText(container, n2.children.toString());
    } else {
      let i = 0;
      while (i < n2.children.length) {
        const newChild = n2.children[i];
        const oldChild = n1.children[i];
        if ((oldChild as VNode)?.__vnode) {
          if ((newChild as VNode).__vnode) {
            if (isSameVNode(oldChild, newChild)) {
              patch(
                oldChild as VNode,
                newChild as VNode,
                container,
                parentComponent,
                isSvg
              );
            } else {
              unmount(oldChild);
              patch(null, newChild, container, parentComponent, isSvg);
            }
          } else {
            unmount(oldChild);
            const textNode = createText(newChild.toString());
            insert(textNode, container);
          }
        } else {
          if ((newChild as VNode).__vnode) {
            patch(null, newChild as VNode, container, parentComponent, isSvg);
          } else {
            const textNode = createText(newChild.toString());
            insert(textNode, container);
          }
        }
        i += 1;
      }
      while (i < n1.children.length) {
        const oldChild = n1.children[i];
        if (oldChild.__vnode) {
          unmount(oldChild);
        }
        i++;
      }
    }
  }

  function patchElement(
    n1: VNode,
    n2: VNode,
    parentComponent: ComponentInstance | null,
    isSvg: boolean
  ) {
    const el = (n2.el = n1.el)!;
    patchProps(el, n1.props, n2.props, isSvg);
    patchChildren(el, n1, n2, parentComponent, isSvg);
  }

  function normalizeSlots(node: VNode): Record<string, (scope: any) => any> {
    let children: any[] = node.children;
    const slots: Record<string, (scope: any) => any> = {};
    if (!Array.isArray(children)) {
      children = [children];
    }
    const defaultChilren: any[] = [];
    children.forEach((child) => {
      if (!child) return;
      if (child.type === Slot) {
        const slotName = child.props?.name || "default";
        if (slotName === "default") {
          defaultChilren.push(child);
        } else {
          if (!slots[slotName])
            slots[slotName] = (scope: any) => child.children;
        }
      } else {
        const slotName = "default";
        if (slotName === "default") {
          defaultChilren.push(child);
        } else {
          if (!slots[slotName]) slots[slotName] = (scope: any) => child;
        }
      }
    });
    slots.default = (scope: any) => defaultChilren;
    return slots;
  }

  function mountElement(
    vnode: VNode,
    container: RenderElement,
    parentComponent: ComponentInstance | null,
    isSvg: boolean
  ) {
    if (typeof vnode.type === "string") {
      const { transitionHook } = vnode;
      const el = createElement(vnode.type as string, isSvg);
      vnode.el = el;
      patchProps(el, null, vnode.props, isSvg);
      transitionHook?.beforeEnter(el);
      insert(el, container);
      transitionHook?.enter(el);
      if (Array.isArray(vnode.children)) {
        vnode.children.forEach((child) => {
          patch(null, child as VNode, el, parentComponent, isSvg);
        });
      } else {
        setText(el, vnode.children.toString());
      }
    }
  }

  function mountComponent(
    vnode: VNode,
    container: RenderElement,
    parentComponent: ComponentInstance | null
  ) {
    const [props, setProps] = createReactive(vnode.props);

    const renderContext: RenderContext = {
      slots: {},
      renderSlot(slotName, defaultNode, scope) {
        const slots = normalizeSlots(instance.vnode);
        const res = slots[slotName]?.(scope);
        if ((Array.isArray(res) && res.length === 0) || !res)
          return defaultNode;
        return res;
      },
    };
    const instance: ComponentInstance = (vnode.instance = {
      effectState: null,
      propState: {
        props,
        setProps,
      },
      subtree: null,
      vnode,
      update: () => {},
      parent: parentComponent,
      appContext,
      provides: Object.create(
        parentComponent ? parentComponent.provides : appContext.provides
      ),
    });
    setCurrentInstance(instance);
    const render = (vnode.type as Function)(props());
    setCurrentInstance(null);
    function renderEffect() {
      // 触发依赖收集
      props();
      const subtree = render(renderContext);
      if (vnode.transitionHook) {
        subtree.transitionHook = vnode.transitionHook;
      }
      patch(instance.subtree, subtree, container, instance, false);
      instance.subtree = subtree;
    }
    instance.update = renderEffect;
    instance.effectState = createEffect(renderEffect, {
      scheduler: queueJob,
    });
  }

  function patchComponent(n1: VNode, n2: VNode, container: RenderElement) {
    const instance = (n2.instance = n1.instance);
    if (instance) instance.vnode = n2;
    if (instance?.propState.props && n2.props) {
      // 应该遍历判断是否有属性变更，避免无用的渲染
      instance.propState.setProps((props: any) => {
        // 子组件props不能解构 否则丢失响应式
        Object.assign(props, n2.props);
      });
    }
  }

  function patch(
    n1: VNode | null,
    n2: VNode,
    container: RenderElement,
    parentComponent: ComponentInstance | null,
    isSvg: boolean
  ) {
    if (n1 && n1.type !== n2?.type) {
      unmount(n1);
      n1 = null;
    }
    if (!n2) return;
    const { type } = n2;
    isSvg = isSvg || type === "svg";
    if (typeof type === "string") {
      if (!n1) {
        mountElement(n2, container, parentComponent, isSvg);
      } else {
        patchElement(n1, n2, parentComponent, isSvg);
      }
    } else if (typeof type === "function") {
      if (!n1) {
        mountComponent(n2, container, parentComponent);
      } else {
        patchComponent(n1, n2, container);
      }
    } else if (type === Text) {
      if (!n1) {
        const el = (n2.el = createText(n2.children.toString()) as any);
        insert(el, container);
      } else {
        const el = (n2.el = n1.el)!;
        if (n1.children !== n2.children) {
          setText(el, n2.children.toString());
        }
      }
    }
  }
  if (vnode) {
    patch(container.__vnode, vnode, container, null, false);
  } else {
    if (container.__vnode) unmount(container.__vnode);
  }
  container.__vnode = vnode;
}
