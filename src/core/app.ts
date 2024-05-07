import { h } from "./h";
import { InjectionKey, Provides, inject, provide } from "./runtime/inject";
import { render, RenderElement } from "./runtime/render";
import domRenderOptions from "./runtime/internals/dom";

export interface Plugin {
  install(app: App): void;
}
export interface App {
  appContext: AppContext;
  mount(container: HTMLElement | null): void;
  provide: typeof provide;
  use: (plugin: Plugin) => App;
}

export interface AppContext {
  app: App | null;
  provides: Provides;
}

export function createApp(rootComponent: any) {
  const appContext: AppContext = {
    app: null,
    provides: Object.create(null),
  };
  const app: App = {
    appContext,
    mount(container) {
      if (!container) return;
      appContext.app = app;
      const root = h(rootComponent, null, []);
      render(root, container as RenderElement, appContext, domRenderOptions);
    },
    provide(key, value) {
      appContext.provides[key as string | symbol] = value;
    },
    use(plugin) {
      plugin.install(app);
      return app;
    },
  };
  return app;
}
