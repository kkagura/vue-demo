import { createReactive } from "@/core/reactive";
// 状态式组件
export const Item = (props: { name: string }) => {
  const [color, setColor] = createReactive("red");
  const changeColor = () => {
    setColor(color() === "red" ? "green" : "red");
  };

  return () => (
    <li>
      <span class={"font-" + color()}>{props.name}</span>
      <button onClick={changeColor}>变色</button>
    </li>
  );
};
