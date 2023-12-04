import { useNamespace } from "@/utils/usNamespace";
import "./button.less";
import { Reader, createMemo } from "@/core/reactive";
import { Component, useEmit } from "@/core/render/component";

const ns = useNamespace("button");
interface ButtonProps {
  text?: string;
  type?: "primary" | "danger";
  onClick?: (e: MouseEvent) => void;
}
const Button: Component<ButtonProps> = (props) => {
  const emit = useEmit<{
    (e: "onClick", payload: MouseEvent): void;
  }>();

  const onClick = (e: MouseEvent) => {
    emit("onClick", e);
  };

  return () => {
    const cls: string[] = [ns.b()];
    if (props.type) {
      cls.push(ns.is(props.type, true));
    }
    return (
      <button onClick={onClick} class={cls}>
        {props.text}
      </button>
    );
  };
};

export default Button;
