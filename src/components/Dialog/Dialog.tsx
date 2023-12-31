import Overlay from "../Overlay/Overlay";
import { useNamespace } from "@/utils/usNamespace";
import Button from "../Button/Button";
import "./dialog.less";
import {
  Component,
  getCurrentInstance,
  useEmit,
  Transition,
  nextTick,
  createEffect,
  Teleport,
} from "@/core";

const ns = useNamespace("dialog");
interface DialogProps {
  visible?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  onOpen?: () => void;
  title?: string;
  width?: string;
  appendToBody?: boolean;
}

const Dialog: Component<DialogProps> = (props) => {
  const emit = useEmit<{
    (e: "close"): void;
    (e: "confirm"): void;
    (e: "open"): void;
  }>();
  const instance = getCurrentInstance<DialogProps>();
  let oldVisible = false;
  createEffect(() => {
    const p = instance!.propState.props();
    if (p.visible && !oldVisible) {
      nextTick().then(() => emit("open"));
    }
    oldVisible = !!p.visible;
  });
  const onClose = async () => {
    emit("close");
  };
  return (context) => {
    const widthStyle = `width:${props.width || "60vw"}`;
    const defaultFooter = (
      <div>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={() => emit("confirm")} type="primary">
          确认
        </Button>
      </div>
    );
    const appendToBody = props.appendToBody === true;
    return (
      <Teleport to="body" disabled={!appendToBody}>
        {props.visible ? (
          <Transition name="dialog-fade" type="animation">
            <Overlay onClose={onClose} visible={props.visible}>
              <div className={ns.b("overlay")}>
                <div style={widthStyle} class={ns.b()}>
                  <div class={ns.e("header")}>
                    <span class={ns.e("title")}>{props.title || ""}</span>
                  </div>
                  <div class={ns.e("content")}>
                    {context.renderSlot("default")}
                  </div>
                  <div class={ns.e("footer")}>
                    {context.renderSlot("footer", defaultFooter)}
                  </div>
                </div>
              </div>
            </Overlay>
          </Transition>
        ) : null}
      </Teleport>
    );
  };
};

export default Dialog;
