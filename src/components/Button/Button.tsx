import { useNamespace } from "@/utils/usNamespace";
import "./button.less";
import { Component, useEmit } from "@/core";

const ns = useNamespace("button");
interface ButtonProps {
  text?: string;
  type?: "primary" | "danger";
  onClick?: (e: MouseEvent) => void;
}
const Button: Component<ButtonProps> = (props) => {
  const emit = useEmit<{
    (e: "click", payload: MouseEvent): void;
  }>();

  const onClick = (e: MouseEvent) => {
    emit("click", e);
  };

  return (context) => {
    const cls: string[] = [ns.b()];
    if (props.type) {
      cls.push(ns.is(props.type, true));
    }
    return (
      <button onClick={onClick} class={cls}>
        {context.renderSlot("default", "默认按钮")}
      </button>
    );
  };
};

export default Button;
