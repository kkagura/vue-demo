import { RenderElement } from "./render";
import { nextFrame } from "../utils";
import { Component, getCurrentInstance, useEmit } from "./component";

export interface TransitionHook {
  beforeEnter: (el: RenderElement) => void;
  enter: (el: RenderElement) => void;
  leave: (el: RenderElement, performanceRemove: () => void) => void;
}

interface TransitionProps {
  name?: string;
  type?: "transition" | "animation";
  mode?: "default" | "out-in";
  onBeforeEnter?: (el: RenderElement) => void;
  onEnter?: (el: RenderElement) => void;
  onAfterEnter?: (el: RenderElement) => void;
  onBeforeLeave?: (el: RenderElement) => void;
  onLeave?: (el: RenderElement) => void;
  onAfterLeave?: (el: RenderElement) => void;
}

const Transition: Component<TransitionProps> = (props) => {
  const getHookClass = (hookName: string) => {
    return (props.name || "") + "-" + hookName;
  };
  const emit = useEmit<{
    (e: "beforeEnter", el: RenderElement): void;
    (e: "enter", el: RenderElement): void;
    (e: "afterEnter", el: RenderElement): void;
    (e: "beforeLeave", el: RenderElement): void;
    (e: "leave", el: RenderElement): void;
    (e: "afterLeave", el: RenderElement): void;
  }>();
  let isLeaving = false;
  const instance = getCurrentInstance();
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
          emit("beforeEnter", el);
        },
        enter(el) {
          nextFrame().then(() => {
            el.classList.remove(getHookClass("enter-from"));
            el.classList.add(getHookClass("enter-to"));
            emit("enter", el);
            const afterEnter = () => {
              el.classList.remove(getHookClass("enter-active"));
              el.classList.remove(getHookClass("enter-to"));
              el.removeEventListener(endEventName, afterEnter);
              emit("afterEnter", el);
            };
            el.addEventListener(endEventName, afterEnter);
          });
        },
        leave(el, performanceRemove) {
          el.classList.add(getHookClass("leave-from"));
          el.classList.add(getHookClass("leave-active"));
          // 强制 reflow，使得初始状态生效
          document.body.offsetHeight;
          emit("beforeLeave", el);
          nextFrame().then(() => {
            el.classList.remove(getHookClass("leave-from"));
            el.classList.add(getHookClass("leave-to"));
            emit("leave", el);
            const afterLeave = () => {
              el.classList.remove(getHookClass("leave-active"));
              el.classList.remove(getHookClass("leave-to"));
              el.removeEventListener(endEventName, afterLeave);
              performanceRemove();
              emit("afterLeave", el);
              isLeaving = false;
              if (props.mode === "out-in") {
                instance?.update();
              }
            };
            el.addEventListener(endEventName, afterLeave);
          });
        },
      };
      vnode.transitionHook = transitionHook;
    }
    if (isLeaving && props.mode === "out-in") {
      return null;
    }
    isLeaving = true;
    return vnode;
  };
};
export default Transition;
