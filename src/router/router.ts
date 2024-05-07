import { App, Component, InjectionKey, Reader, createReactive } from "@/core";
import { createWebHistory } from "./history";
import {
  LocationQuery,
  RouteLocationNormalized,
  RouteLocationRaw,
  RouteRecord,
  Router,
} from "./type";
import { createRouterMatcher } from "./matcher";
import { assign } from "./utils";

const START_LOCATION_NORMALIZED: RouteLocationNormalized = {
  path: "/",
  name: undefined,
  params: {},
  query: {},
  fullPath: "/",
  meta: {},
  matched: undefined,
};

export const routeKey: InjectionKey<Reader<RouteLocationNormalized>> = Symbol();
export const routerKey: InjectionKey<Router> = Symbol();

export function createRouter(base = "/", routes: RouteRecord[]): Router {
  const routerHistory = createWebHistory();
  const matcher = createRouterMatcher(routes);

  const [currentRoute, setCurrentRoute] =
    createReactive<RouteLocationNormalized>({
      ...START_LOCATION_NORMALIZED,
    });

  const push = (rawLocation: RouteLocationRaw) => {
    return pushWithRedirect(rawLocation);
  };

  const replace = (rawLocation: RouteLocationRaw) => {
    if (typeof rawLocation === "string") {
      rawLocation = {
        path: rawLocation,
      };
    }
    return push(assign(rawLocation, { replace: true }));
  };

  const resolve = (to: RouteLocationRaw): RouteLocationNormalized => {
    const normalizeLocation =
      typeof to === "string"
        ? {
            path: to,
          }
        : to;
    const query: LocationQuery =
      "query" in normalizeLocation ? normalizeLocation.query || {} : {};
    const resolved = matcher.resolve(to, assign({}, currentRoute()));
    return {
      ...resolved,
      query,
      fullPath: resolved.path,
      meta: resolved.meta || {},
    };
  };

  const pushWithRedirect = (rawLocation: RouteLocationRaw) => {
    const toLocation = resolve(rawLocation);
    const isReplace =
      typeof rawLocation === "string" ? false : rawLocation.replace === true;
    finalizeNavigation(toLocation, isReplace);
  };

  const finalizeNavigation = (
    toLocation: RouteLocationNormalized,
    replace: boolean
  ) => {
    if (replace === true) {
      routerHistory.replace(toLocation.fullPath);
    } else {
      routerHistory.push(toLocation.fullPath);
    }
    setCurrentRoute((val) => {
      assign(val, toLocation);
    });
  };

  const router: Router = {
    currentRoute,
    replace,
    push,
    install(app: App) {
      app.provide(routeKey, currentRoute);
      app.provide(routerKey, router);
    },
  };

  replace(location.pathname);
  return router;
}
