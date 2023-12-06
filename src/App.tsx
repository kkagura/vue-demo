import Button from "./components/Button/Button";
import Checkbox from "./components/Checkbox/Checkbox";
import { createReactive } from "./core/reactive";
import Input from "./components/Input/Input";
import Dialog from "./components/Dialog/Dialog";

export const App = () => {
  const onClick = () => {
    setVisible(true);
  };
  const [checked, setChecked] = createReactive(true);
  const [inputVal, setInputVal] = createReactive("123");
  const [visible, setVisible] = createReactive(false);
  return () => (
    <div>
      <Button onClick={onClick} type="primary">
        打开弹窗
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
      <Dialog
        title="弹窗标题"
        visible={visible()}
        onClose={() => setVisible(false)}
      >
        我是一段话
      </Dialog>
    </div>
  );
};
