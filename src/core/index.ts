import { h } from "./h";
import { RenderElement, render } from "./runtime/render";
export * from "./reactive";
export * from "./runtime";
export { nextTick } from "./scheduler";

export function createApp(rootComponent: any) {
  const app = {
    mount(container: HTMLElement | null) {
      if (!container) return;
      const root = h(rootComponent, null, []);
      render(root, container as RenderElement);
    },
  };
  return app;
}
