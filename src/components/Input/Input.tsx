import { Component, createReactive } from "@/core";
import { useNamespace } from "@/utils/usNamespace";
import "./input.less";

const ns = useNamespace("input");

interface InputProps {
  value?: string;
  onInput?: (val: string) => void;
  placeholder?: string;
}

const Input: Component<InputProps> = (props) => {
  const [isFocus, setIsFocus] = createReactive(false);
  const onFocus = () => {
    setIsFocus(true);
  };
  const onBlur = () => {
    setIsFocus(false);
  };
  const onInput = (e: InputEvent) => {
    const target: any = e.target;
    props.onInput?.(target.value as string);
  };
  return () => {
    const inputVal = props.value || "";
    const placeholder = props.placeholder || "";
    return (
      <div class={ns.b()}>
        <div class={[ns.e("wrapper"), ns.is("focus", isFocus())]}>
          <input
            placeholder={placeholder}
            onInput={onInput}
            onFocus={onFocus}
            onBlur={onBlur}
            value={inputVal}
            class={ns.e("inner")}
            type="text"
          />
        </div>
      </div>
    );
  };
};

export default Input;
