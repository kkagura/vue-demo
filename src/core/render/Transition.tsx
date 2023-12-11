import { RenderElement } from ".";
import { nextFrame } from "../utils";
import { Component, getCurrentInstance } from "./component";

export interface TransitionHook {
  beforeEnter: (el: RenderElement) => void;
  enter: (el: RenderElement) => void;
  leave: (el: RenderElement, performanceRemove: () => void) => void;
}

interface TransitionProps {
  name?: string;
  type?: "transition" | "animation";
}

const Transition: Component<TransitionProps> = (props) => {
  const getHookClass = (hookName: string) => {
    return (props.name || "") + "-" + hookName;
  };
  return (context) => {
    const type = props.type || "transition";
    const endEventName = type + "end";
    let vnode = context.renderSlot("default");
    if (Array.isArray(vnode)) {
      if (vnode.length > 1) {
        console.warn("Transition组件只能有一个子节点");
      }
      vnode = vnode[0];
    }
    if (vnode) {
      const transitionHook: TransitionHook = {
        beforeEnter(el) {
          el.classList.add(getHookClass("enter-from"));
          el.classList.add(getHookClass("enter-active"));
        },
        enter(el) {
          nextFrame().then(() => {
            el.classList.remove(getHookClass("enter-from"));
            el.classList.add(getHookClass("enter-to"));
            const afterEnter = () => {
              el.classList.remove(getHookClass("enter-active"));
              el.classList.remove(getHookClass("enter-to"));
              el.removeEventListener(endEventName, afterEnter);
            };
            el.addEventListener(endEventName, afterEnter);
          });
        },
        leave(el, performanceRemove) {
          el.classList.add(getHookClass("leave-from"));
          el.classList.add(getHookClass("leave-active"));
          // 强制 reflow，使得初始状态生效
          document.body.offsetHeight;
          nextFrame().then(() => {
            el.classList.remove(getHookClass("leave-from"));
            el.classList.add(getHookClass("leave-to"));
            const afterLeave = () => {
              el.classList.remove(getHookClass("leave-active"));
              el.classList.remove(getHookClass("leave-to"));
              el.removeEventListener(endEventName, afterLeave);
              performanceRemove();
            };
            el.addEventListener(endEventName, afterLeave);
          });
        },
      };
      vnode.transitionHook = transitionHook;
    }
    return vnode;
  };
};
export default Transition;
