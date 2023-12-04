import "./style.css";

import { createEffect, createReactive } from "./core/reactive";
import { createApp } from "./core/render";

// const [text1, setText1] = createReactive("text1");
// const [text2, setText2] = createReactive("text2");
// const [bool, setBool] = createReactive(true);

// createEffect(() => {
//   if (bool()) {
//     console.log(text1());
//   } else {
//     console.log(text2());
//   }
// });
// setBool(false);
// setText1("text1 changed");
// setText2("text2 changed");

import { App } from "./App";
const app = createApp(App);
app.mount(document.getElementById("app"));

// const [name, setName] = createReactive("wang jian");
// const effectState = createEffect(() => {
//   console.log(name());
// });
// setName("wang jian2");
// effectState.stop();
// setName("wang jian3");
