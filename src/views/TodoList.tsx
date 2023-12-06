import { createReactive } from "@/core/reactive";
import { Component } from "@/core/render/component";
import TodoItemView from "./components/TodoItem";
import "./todoList.less";

export type TodoStatus = "todo" | "resolved";

export interface TodoItem {
  status: TodoStatus;
  name: string;
}

const todoListOrigin: TodoItem[] = [
  {
    status: "resolved",
    name: "待办AAAAAA",
  },
  {
    status: "todo",
    name: "待办BBBBBB",
  },
];

const TodoList: Component<{}> = () => {
  const [todoList, setTodoList] = createReactive(todoListOrigin);
  const toggelStatus = (i: number, status: TodoStatus) => {
    setTodoList((list) => {
      list[i].status = status;
    });
  };
  return () => {
    return (
      <div class="todo-list">
        {todoList().map((item, i) => {
          return (
            <TodoItemView
              onStatusChange={(status) => {
                toggelStatus(i, status);
              }}
              todoItem={item}
            ></TodoItemView>
          );
        })}
      </div>
    );
  };
};

export default TodoList;
