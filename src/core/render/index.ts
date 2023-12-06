import { h } from "../h";
import { createEffect, createReactive } from "../reactive";
import { queueJob } from "../scheduler";
import { Slot, Text, VNode, VNodeProps } from "../vnode";
import { ComponentInstance, setCurrentInstance } from "./component";
const svgNS = "http://www.w3.org/2000/svg";
const xlinkNS = "http://www.w3.org/1999/xlink";

interface EventInvoker {
  origin: Function;
  wrapper: (this: HTMLElement, e: unknown) => void;
}

export interface RenderElement extends HTMLElement {
  __vnode: VNode | null;
  __invokers: Record<string, EventInvoker>;
}

export interface RenderContext {
  renderSlot: (slotName: string, defaultNode?: any, scope?: any) => any;
}

function render(vnode: VNode | null, container: RenderElement) {
  function unmount(vnode: VNode) {
    if (vnode.instance?.subtree) {
      unmount(vnode.instance.subtree);
      return;
    }
    const el = vnode.el;
    if (el) {
      el.parentNode?.removeChild(el);
    }
  }

  function normalizeCls(clsValue: any) {
    if (Array.isArray(clsValue)) {
      return clsValue.filter(Boolean).join(" ");
    }
    if (typeof clsValue === "object") {
      const keys = Object.keys(clsValue);
      const cls: any = [];
      keys.forEach((el) => {
        if (!!clsValue[el]) {
          cls.push(el);
        }
      });
      return cls.filter(Boolean).join("");
    }
    return clsValue;
  }

  function patchProp(
    el: RenderElement,
    key: string,
    newValue: any,
    isSvg: boolean
  ) {
    // on开头的当作事件去处理
    if (/^on/.test(key)) {
      const invokers = el.__invokers || (el.__invokers = {});
      let invoker = invokers[key];
      const eventName = key.slice(2).toLowerCase();
      if (newValue) {
        if (!invoker) {
          invoker = {
            origin: newValue,
            wrapper: function (ev: unknown) {
              invoker.origin(ev);
            },
          };
          el.addEventListener(eventName, invoker.wrapper);
          invokers[key] = invoker;
        } else {
          invoker.origin = newValue;
        }
      } else {
        if (invoker) {
          el.removeEventListener(eventName, invoker.wrapper);
        }
      }
    } else if (key === "class") {
      const cls = normalizeCls(newValue);
      if (!cls) {
        el.removeAttribute("class");
      } else if (isSvg) {
        el.setAttribute("class", cls);
      } else {
        el.className = cls;
      }
    } else if (key in el) {
      (el as any)[key] = newValue;
    } else {
      const useNs = key.startsWith("xlink:");
      if (useNs) {
        console.log("xxx");
      }
      if (newValue == null) {
        if (isSvg && useNs) {
          el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
        } else {
          el.removeAttribute(key);
        }
      } else {
        if (isSvg && useNs) {
          el.setAttributeNS(xlinkNS, key, newValue);
        } else {
          el.setAttribute(key, newValue);
        }
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
    isSvg: boolean
  ) {
    if (!Array.isArray(n1.children)) {
      if (Array.isArray(n2.children)) {
        container.textContent = "";
        n2.children.forEach((child) => patch(null, child, container, isSvg));
      } else {
        container.textContent = n2.children.toString();
      }
    } else if (!Array.isArray(n2.children)) {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => unmount(child));
      }
      container.textContent = n2.children.toString();
    } else {
      let i = 0;
      while (i < n2.children.length) {
        const newChild = n2.children[i];
        const oldChild = n1.children[i];
        if ((oldChild as VNode)?.__vnode) {
          if ((newChild as VNode).__vnode) {
            if (isSameVNode(oldChild, newChild)) {
              patch(oldChild as VNode, newChild as VNode, container, isSvg);
            } else {
              unmount(oldChild);
              patch(null, newChild, container, isSvg);
            }
          } else {
            unmount(oldChild);
            const textNode = document.createTextNode(newChild.toString());
            container.appendChild(textNode);
          }
        } else {
          if ((newChild as VNode).__vnode) {
            patch(null, newChild as VNode, container, isSvg);
          } else {
            const textNode = document.createTextNode(newChild.toString());
            container.appendChild(textNode);
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

  function patchElement(n1: VNode, n2: VNode, isSvg: boolean) {
    const el = (n2.el = n1.el)!;
    patchProps(el, n1.props, n2.props, isSvg);
    patchChildren(el, n1, n2, isSvg);
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
    isSvg: boolean
  ) {
    if (typeof vnode.type === "string") {
      const el = (
        isSvg
          ? document.createElementNS(svgNS, vnode.type)
          : document.createElement(vnode.type)
      ) as RenderElement;
      vnode.el = el;
      container.appendChild(el);
      if (Array.isArray(vnode.children)) {
        vnode.children.forEach((child) => {
          patch(null, child as VNode, el, isSvg);
        });
      } else {
        el.textContent = vnode.children.toString();
      }
      patchProps(el, null, vnode.props, isSvg);
    }
  }

  function mountComponent(node: VNode, container: RenderElement) {
    const [props, setProps] = createReactive(node.props);
    const instance: ComponentInstance = (node.instance = {
      effectState: null,
      propState: {
        props: null,
        setProps,
      },
      subtree: null,
    });
    setCurrentInstance(instance);
    const render = (node.type as Function)(props());
    const slots = normalizeSlots(node);
    setCurrentInstance(null);
    const renderContext: RenderContext = {
      renderSlot(slotName, defaultNode, scope) {
        const res = slots[slotName]?.(scope);
        if ((Array.isArray(res) && res.length === 0) || !res)
          return defaultNode;
        return res;
      },
    };
    function renderEffect() {
      instance.propState.props = props();
      const subtree = render(renderContext);
      patch(instance.subtree, subtree, container, false);
      instance.subtree = subtree;
    }
    instance.effectState = createEffect(renderEffect.bind(node), {
      scheduler: queueJob,
    });
  }

  function patchComponent(n1: VNode, n2: VNode, container: RenderElement) {
    const instance = (n2.instance = n1.instance);
    if (instance?.propState.props && n2.props) {
      // 应该遍历
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
    isSvg: boolean
  ) {
    isSvg = isSvg || n2.type === "svg";
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
    }
    if (!n2) return;
    const { type } = n2;
    if (typeof type === "string") {
      if (!n1) {
        mountElement(n2, container, isSvg);
      } else {
        patchElement(n1, n2, isSvg);
      }
    } else if (typeof type === "function") {
      if (!n1) {
        mountComponent(n2, container);
      } else {
        patchComponent(n1, n2, container);
      }
    } else if (type === Text) {
      if (!n1) {
        const el = (n2.el = document.createTextNode(
          n2.children.toString()
        ) as any);
        container.appendChild(el);
      } else {
        const el = (n2.el = n1.el)!;
        if (n1.children !== n2.children) {
          el.textContent = n2.children.toString();
        }
      }
    }
  }
  if (vnode) {
    patch(container.__vnode, vnode, container, false);
  } else {
    if (container.__vnode) unmount(container.__vnode);
  }
  container.__vnode = vnode;
}

export function createApp(rootComponent: any) {
  const app = {
    mount(container: HTMLElement | null) {
      if (!container) return;
      const root = h(rootComponent, null, []);
      render(root, container as RenderElement);
    },
  };
  return app;
}
