import { RenderElement } from ".";
import { VNode } from "../vnode";
import { Component, ComponentInstance } from "./component";

interface TeleportProps {
  to?: string | RenderElement;
  disabled?: boolean;
}

const Teleport: Component<TeleportProps> = () => {
  return (context) => {
    const vnode = context.renderSlot("default");
    if (Array.isArray(vnode)) {
      return vnode[0];
    }
    return vnode;
  };
};
Teleport.process = function (
  n1,
  n2,
  container,
  parentComponent: ComponentInstance | null,
  { patch, patchChildren, unmount, move, nodeOps }
) {
  if (!n1) {
    if (n2) {
      const props = n2.props as TeleportProps;
      const to = props.to;
      let target: RenderElement = container;
      if (props.disabled !== true) {
        if (typeof to === "string") {
          const toElement = nodeOps.querySelector(to);
          if (!toElement) {
            console.log(`${to} 不存在`);
          } else {
            target = toElement;
          }
        } else {
          to && (target = to);
        }
      }
      n2.children.forEach((child: VNode) => {
        patch(null, child, target, parentComponent, false);
      });
    }
  } else {
    if (n2) {
      patchChildren(container, n1, n2, parentComponent, false);
      const newProps = n2.props as TeleportProps;
      const oldProps = n1.props as TeleportProps;
      let target: RenderElement = container;
      const to = newProps.to;
      if (newProps.disabled !== true) {
        if (typeof to === "string") {
          const toElement = nodeOps.querySelector(to);
          if (!toElement) {
            console.log(`${to} 不存在`);
          } else {
            target = toElement;
          }
        } else {
          to && (target = to);
        }
      }
      n2.children.forEach((vnode: VNode) => {
        move(vnode, target);
      });
    } else {
      unmount(n1);
    }
  }
};

export default Teleport;
