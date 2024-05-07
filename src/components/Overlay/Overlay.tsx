import { Component, useEmit } from "@/core";
import "./overlay.less";
import { useNamespace } from "@/utils/usNamespace";

interface OverlayProps {
  visible?: boolean;
  onClose?: () => void;
}

const Overlay: Component<OverlayProps> = (props) => {
  const ns = useNamespace("overlay");
  const b = ns.b();
  const emit = useEmit<{
    (e: "close"): void;
  }>();
  console.log(b);
  const onClickOverlay = (e: MouseEvent) => {
    const target = e.target;
    console.log(target, b);
    if (target instanceof HTMLElement) {
      if (target.classList.contains(b)) {
        emit("close");
      }
    }
  };
  return (context) => {
    const displayStyle = props.visible ? "" : "display: none";
    return (
      <div onClick={onClickOverlay} style={displayStyle} class={b}>
        {context.renderSlot("default")}
      </div>
    );
  };
};

export default Overlay;
