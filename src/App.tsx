import Button from "./components/Button/Button";
import Checkbox from "./components/Checkbox/Checkbox";
import { createReactive } from "./core/reactive";
import Input from "./components/Input/Input";

export const App = () => {
  const onClick = () => {
    console.log("onClick");
  };
  const [checked, setChecked] = createReactive(true);
  const [inputVal, setInputVal] = createReactive("123");
  return () => (
    <div>
      <Button onClick={onClick} type="primary">
        <p>sdas</p>sdasd
      </Button>
      <Checkbox
        checked={checked()}
        onChange={setChecked}
        label="是大叔大叔大叔"
      ></Checkbox>
      <p>{inputVal()}</p>
      <Input
        placeholder="请输入"
        value={inputVal()}
        onInput={(val) => setInputVal(val)}
      ></Input>
    </div>
  );
};
