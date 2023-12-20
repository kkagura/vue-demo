import { h } from "./h";
import { InjectionKey, Provides } from "./runtime/inject";
import { render, RenderElement } from "./runtime/render";

export interface App {
  appContext: AppContext;
  mount(container: HTMLElement | null): void;
  provide<T>(key: string | InjectionKey<T>, value: T): void;
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
      render(root, container as RenderElement, appContext);
    },
    provide(key, value) {
      appContext.provides[key as string | symbol] = value;
    },
  };
  return app;
}
