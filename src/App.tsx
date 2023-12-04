import Button from "./components/Button/Button";

export const App = () => {
  const onClick = () => {
    console.log("onClick");
  };
  return () => (
    <div>
      <Button onClick={onClick} type="primary" text={"123"}></Button>
    </div>
  );
};
