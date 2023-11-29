import { createEffect, createReactive } from "../reactive";
import { queueJob } from "../scheduler";
import { ComponentInstance, Text, VNode, VNodeProps } from "../vnode";

interface EventInvoker {
  origin: Function;
  wrapper: (this: HTMLElement, e: unknown) => void;
}

export interface RenderElement extends HTMLElement {
  __vnode: VNode | null;
  __invokers: Record<string, EventInvoker>;
}

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

function patchProp(el: RenderElement, key: string, newValue: any) {
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
    el.className = newValue;
  } else if (key in el) {
    (el as any)[key] = newValue;
  } else {
    if (newValue == null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, newValue);
    }
  }
}

function patchProps(
  el: RenderElement,
  oldProps: VNodeProps | null,
  newProps: VNodeProps | null
) {
  oldProps = oldProps || {};
  newProps = newProps || {};
  for (const key in newProps) {
    const newVal = newProps[key];
    const oldVal = oldProps[key];
    if (newVal !== oldVal) {
      patchProp(el, key, newVal);
    }
  }
  for (const key in oldProps) {
    if (!(key in newProps)) {
      patchProp(el, key, null);
    }
  }
}

function isSameVNode(n1: VNode, n2: VNode) {
  return n1.type === n2.type;
}

// function patchChildren(container: RenderElement, n1: VNode, n2: VNode) {
//   n1.children.forEach((el) => {
//     if (typeof el !== "string") {
//       unmount(el);
//     }
//   });
//   n2.children.forEach((el) => {
//     if (typeof el === "string") {
//       const textNode = document.createTextNode(el);
//       container.appendChild(textNode);
//     } else {
//       patch(null, el, container);
//     }
//   });
// }

function patchChildren(container: RenderElement, n1: VNode, n2: VNode) {
  if (!Array.isArray(n1.children)) {
    if (Array.isArray(n2.children)) {
      container.textContent = "";
      n2.children.forEach((child) => patch(null, child, container));
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
            patch(oldChild as VNode, newChild as VNode, container);
          } else {
            unmount(oldChild);
            patch(null, newChild, container);
          }
        } else {
          unmount(oldChild);
          const textNode = document.createTextNode(newChild.toString());
          container.appendChild(textNode);
        }
      } else {
        if ((newChild as VNode).__vnode) {
          patch(null, newChild as VNode, container);
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

function patchElement(n1: VNode, n2: VNode) {
  const el = (n2.el = n1.el)!;
  patchProps(el, n1.props, n2.props);
  patchChildren(el, n1, n2);
}

function mountElement(vnode: VNode, container: RenderElement) {
  if (typeof vnode.type === "string") {
    const el = document.createElement(vnode.type) as RenderElement;
    vnode.el = el;
    container.appendChild(el);
    if (Array.isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        patch(null, child as VNode, el);
      });
    } else {
      el.textContent = vnode.children.toString();
    }
    patchProps(el, null, vnode.props);
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
  const render = (node.type as Function)(props());
  instance.effectState = createEffect(
    () => {
      instance.propState.props = props();
      const subtree = render();
      patch(instance.subtree, subtree, container);
      instance.subtree = subtree;
    },
    {
      scheduler: queueJob,
    }
  );
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

function patch(n1: VNode | null, n2: VNode, container: RenderElement) {
  if (n1 && n1.type !== n2.type) {
    unmount(n1);
    n1 = null;
  }
  const { type } = n2;
  if (typeof type === "string") {
    if (!n1) {
      mountElement(n2, container);
    } else {
      patchElement(n1, n2);
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

function render(vnode: VNode | null, container: RenderElement) {
  if (vnode) {
    patch(container.__vnode, vnode, container);
  } else {
    if (container.__vnode) unmount(container.__vnode);
  }
  container.__vnode = vnode;
}

export function createApp(rootComponent: any) {
  const app = {
    mount(container: HTMLElement | null) {
      if (!container) return;
      const rootRender = rootComponent();
      createEffect(
        () => {
          const rootNode = rootRender();
          render(rootNode, container as RenderElement);
        },
        {
          scheduler: queueJob,
        }
      );
    },
  };
  return app;
}
