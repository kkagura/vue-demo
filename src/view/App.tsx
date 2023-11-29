import { createReactive } from "@/core/reactive";
import { Item } from "./Item";
const todoList = ["待办1", "待办2", "待办3", "待办4", "待办5", "待办6"];

export const App = () => {
  const [name, setName] = createReactive("23321");

  const [list, setList] = createReactive<string[]>(todoList);
  const handleAdd = () => {
    if (!name()) return;
    setList((list) => {
      list.push(name());
    });
    setName("");
  };

  const handleTextChange = (e: InputEvent) => {
    setName((e.target as HTMLInputElement).value);
  };

  const [page, setPage] = createReactive(1);
  const [pageSize, setPageSize] = createReactive(5);

  return () => {
    const totalList = list();
    const totalCount = totalList.length;
    const currentPage = page();
    const currentPageList = todoList.slice(
      (currentPage - 1) * pageSize(),
      currentPage * pageSize()
    );
    console.log("重新渲染了");
    const pageBtns = new Array(Math.ceil(totalCount / pageSize())).fill(null);
    return (
      <div data="1" class="div">
        <input value={name()} onChange={handleTextChange} type="text" />
        <button onClick={handleAdd}>添加</button>
        <ul>
          {currentPageList.map((name) => {
            return <Item name={name}></Item>;
          })}
        </ul>
        <div>
          {pageBtns.map((_, index) => {
            return (
              <div
                onClick={() => {
                  setPage(index + 1);
                }}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
};
