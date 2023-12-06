import { Component, useEmit } from "@/core/render/component";
import { useNamespace } from "@/utils/usNamespace";
import "./checkbox.less";

const ns = useNamespace("checkbox");

interface CheckboxProps {
  checked: boolean;
  label?: string;
  onChange?: (val: boolean) => void;
}
const Checkbox: Component<CheckboxProps> = (props) => {
  const emit = useEmit<{
    (e: "change", val: boolean): void;
  }>();
  const changeState = () => {
    const val = !props.checked;
    emit("change", val);
  };

  return () => {
    const cls: string[] = [ns.b(), ns.is("checked", props.checked)];
    return (
      <div onClick={changeState} class={cls}>
        <span class={ns.e("input")}>
          <span class={ns.e("inner")}></span>
        </span>
        {props.label ? <span class={ns.e("label")}>{props.label}</span> : null}
      </div>
    );
  };
};

export default Checkbox;
