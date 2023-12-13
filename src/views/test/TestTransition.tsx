import { createReactive } from "@/core/reactive";
import Transition from "@/core/render/Transition";
import Button from "@/components/Button/Button";
import "./testTransition.less";

const TestTransition = () => {
  const [tab, setTab] = createReactive("a");
  const toggleTab = () => {
    if (tab() === "a") {
      setTab("b");
    } else {
      setTab("a");
    }
  };
  return () => (
    <div>
      <div onClick={toggleTab}>切换</div>
      <Transition name="fade">
        {tab() === "a" ? <Button>aaaa</Button> : null}
      </Transition>
    </div>
  );
};

export default TestTransition;
