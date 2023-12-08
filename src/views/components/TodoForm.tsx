import Dialog from "@/components/Dialog/Dialog";
import { Component, useEmit } from "@/core/render/component";
import { TodoItem } from "../TodoList";
import { createMemo, createReactive } from "@/core/reactive";
import Input from "@/components/Input/Input";

interface TodoFormProps {
  visible?: boolean;
  todoItem: TodoItem | null;
  onClose?: () => void;
  onConfirm?: (data: { name: string }) => void;
}

const TodoForm: Component<TodoFormProps> = (props) => {
  const emit = useEmit<{
    (e: "close"): void;
    (e: "confirm", data: { name: string }): void;
  }>();
  const onClose = () => {
    emit("close");
  };
  const [formData, setFormData] = createReactive({ name: "" });
  const title = createMemo(() => (formData() ? "编辑待办" : "新增待办"));
  const handleNameChange = (name: string) => {
    setFormData((form) => {
      form.name = name;
    });
  };
  const handleConfirm = () => {
    emit("confirm", { ...formData() });
    emit("close");
  };
  const onOpen = () => {
    setFormData((form) => {
      form.name = props.todoItem?.name || "";
    });
  };
  return () => {
    const formDataObj = formData();
    return (
      <Dialog
        onConfirm={handleConfirm}
        title={title()}
        onClose={onClose}
        visible={props.visible}
        onOpen={onOpen}
      >
        <div className="form">
          <div className="form-item">
            <span className="form-item__label">待办名称:</span>
            <Input
              onInput={handleNameChange}
              value={formDataObj.name}
              placeholder="请输入"
            ></Input>
          </div>
        </div>
      </Dialog>
    );
  };
};

export default TodoForm;
