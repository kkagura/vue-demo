import { Component, useEmit } from "@/core/render/component";
import Overlay from "../Overlay/Overlay";
import { useNamespace } from "@/utils/usNamespace";
import Button from "../Button/Button";
import "./dialog.less";

const ns = useNamespace("dialog");
interface DialogProps {
  visible?: boolean;
  onClose?: () => void;
  title?: string;
  width?: string;
}

const Dialog: Component<DialogProps> = (props) => {
  const emit = useEmit<{
    (e: "close"): void;
    (e: "confirm"): void;
  }>();
  return (context) => {
    const widthStyle = `width:${props.width || "60vw"}`;
    const defaultFooter = (
      <div>
        <Button onClick={() => emit("close")}>取消</Button>
        <Button onClick={() => emit("confirm")} type="primary">
          确认
        </Button>
      </div>
    );
    return (
      <Overlay onClose={() => emit("close")} visible={props.visible}>
        <div style={widthStyle} class={ns.b()}>
          <div class={ns.e("header")}>
            <span class={ns.e("title")}>{props.title || ""}</span>
          </div>
          <div class={ns.e("content")}>{context.renderSlot("default")}</div>
          <div class={ns.e("footer")}>
            {context.renderSlot("footer", defaultFooter)}
          </div>
        </div>
      </Overlay>
    );
  };
};

export default Dialog;
