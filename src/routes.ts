import { RouteRecord } from "./router/type";
import Page1 from "./views/Page1";
import Page2 from "./views/Page2";

const routes: RouteRecord[] = [
  {
    name: "Page1",
    path: "/page1",
    component: Page1,
  },
  {
    name: "Page2",
    path: "/page2",
    component: Page2,
  },
];

export default routes;
