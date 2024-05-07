import { Component } from "@/core";
import Button from "@/components/Button/Button";
import { useRouter } from "@/router/api";

const Page1: Component = () => {
  const router = useRouter();
  const onClick = () => {
    router.push("/page2");
  };
  return () => {
    return (
      <Button onClick={onClick} type="primary">
        go to page2
      </Button>
    );
  };
};

export default Page1;
