import { Component, createReactive } from "@/core";
import TodoItemView from "./components/TodoItem";
import "./todoList.less";
import TodoForm from "./components/TodoForm";
import Button from "@/components/Button/Button";

export type TodoStatus = "todo" | "resolved";

export interface TodoItem {
  status: TodoStatus;
  name: string;
}

let todoListOrigin: TodoItem[] = [];
const storageCacheKey = "todolist-cache";
const cacheJson = localStorage.getItem(storageCacheKey);
if (cacheJson) {
  try {
    todoListOrigin = JSON.parse(cacheJson);
  } catch (error) {}
}

const TodoList: Component<{}> = () => {
  const [todoList, setTodoList] = createReactive(todoListOrigin);
  const toggelStatus = (i: number, status: TodoStatus) => {
    setTodoList((list) => {
      list[i].status = status;
    });
  };

  const handleRemove = (i: number) => {
    setTodoList((list) => {
      list.splice(i, 1);
    });
  };

  const [formVisible, setFormVisible] = createReactive(false);
  const [currentItem, setCurrentItem] = createReactive<TodoItem | null>(null);
  let currentOperateIdx = -1;
  const handleEdit = (i: number) => {
    currentOperateIdx = i;
    const item = todoList()[i];
    setCurrentItem(item);
    setFormVisible(true);
  };
  const handleAdd = () => {
    currentOperateIdx = -1;
    setCurrentItem(null);
    setFormVisible(true);
  };

  const handleFormConfirm = (data: { name: string }) => {
    if (currentOperateIdx > -1) {
      setTodoList((list) => {
        list[currentOperateIdx].name = data.name;
      });
    } else {
      setTodoList((list) => {
        list.push({
          ...data,
          status: "todo",
        });
      });
    }
  };

  const handleSaveCache = () => {
    localStorage.setItem(storageCacheKey, JSON.stringify(todoList()));
  };

  return () => {
    return (
      <div class="todo-list">
        <div>
          <Button onClick={handleAdd} type="primary">
            新增待办
          </Button>
          <Button onClick={handleSaveCache} type="primary">
            保存
          </Button>
        </div>
        <div class="todo-list-wrapper">
          {todoList().map((item, i) => {
            return (
              <TodoItemView
                onStatusChange={(status) => {
                  toggelStatus(i, status);
                }}
                onRemove={() => handleRemove(i)}
                onEdit={() => handleEdit(i)}
                todoItem={item}
              ></TodoItemView>
            );
          })}
        </div>
        <TodoForm
          onClose={() => setFormVisible(false)}
          visible={formVisible()}
          todoItem={currentItem()}
          onConfirm={handleFormConfirm}
        ></TodoForm>
      </div>
    );
  };
};

export default TodoList;
