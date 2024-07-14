import { Component } from "@/core";
import Button from "@/components/Button/Button";
import { useRouter } from "@/router/api";
import TodoList from "./todo-list/TodoList";

const Page1: Component = () => {
  const router = useRouter();
  const onClick = () => {
    router.push("/page2");
  };
  return () => {
    return <TodoList></TodoList>;
  };
};

export default Page1;
