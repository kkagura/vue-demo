import "./assets/component.less";
import "./assets/common.less";
import "./assets/iconfont";
import { createApp } from "./core";
import { App } from "./App";
import { createRouter } from "./router";
import routes from "./routes";

const app = createApp(App);
const router = createRouter("", routes);
app.use(router).mount(document.getElementById("app"));
