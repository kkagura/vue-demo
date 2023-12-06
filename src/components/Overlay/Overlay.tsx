import { Component, useEmit } from "@/core/render/component";
import "./overlay.less";
import { useNamespace } from "@/utils/usNamespace";

const ns = useNamespace("overlay");

interface OverlayProps {
  visible?: boolean;
  onClose?: () => void;
}

const Overlay: Component<OverlayProps> = (props) => {
  const b = ns.b();
  const emit = useEmit<{
    (e: "close"): void;
    (e: "click-overlay"): void;
  }>();
  const onClickOverlay = (e: MouseEvent) => {
    const target = e.target;
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
