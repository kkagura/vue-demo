import Button from "./components/Button/Button";
import Checkbox from "./components/Checkbox/Checkbox";
import { createReactive } from "./core/reactive";

export const App = () => {
  const onClick = () => {
    console.log("onClick");
  };
  const [checked, setChecked] = createReactive(true);
  return () => (
    <div>
      <Button onClick={onClick} type="primary" text={"123"}>
        ddd
      </Button>
      {/* <Checkbox
        checked={checked()}
        onChange={setChecked}
        label="是大叔大叔大叔"
      ></Checkbox> */}
    </div>
  );
};
