import { Component, useEmit } from "@/core/render/component";
import { TodoItem, TodoStatus } from "../TodoList";
import Checkbox from "@/components/Checkbox/Checkbox";

interface TodoItemProps {
  todoItem: TodoItem;
  onStatusChange?: (status: TodoStatus) => void;
}

const TodoItemView: Component<TodoItemProps> = (props) => {
  const emit = useEmit<{
    (e: "statusChange", val: TodoStatus): void;
  }>();
  return () => {
    const { todoItem } = props;
    const isResolved = todoItem.status === "resolved";
    const onStatusChange = (val: boolean) => {
      const status: TodoStatus = val ? "resolved" : "todo";
      emit("statusChange", status);
    };
    return (
      <div
        class={{
          "todo-list-item": true,
          "is-resolved": isResolved,
        }}
      >
        <Checkbox onChange={onStatusChange} value={isResolved}></Checkbox>
        <span class="todo-list-name">{todoItem.name}</span>
        <svg class="iconfont icon-primary" aria-hidden="true">
          <use xlink:href="#icon-bianji"></use>
        </svg>
        <svg class="iconfont icon-danger" aria-hidden="true">
          <use xlink:href="#icon-shanchu"></use>
        </svg>
      </div>
    );
  };
};

export default TodoItemView;
