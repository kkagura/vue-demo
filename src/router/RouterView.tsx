import { Component, inject, provide } from "@/core";
import { useRoute } from "./api";
import { routeKey } from "./router";
import { h } from "@/core/h";

const RouterView: Component = () => {
  const getRoute = inject(routeKey)!;
  provide(routeKey, getRoute);
  return () => {
    const route = getRoute();
    if (route.matched) {
      return h(route.matched.component, {});
    }
    return <></>;
  };
};

export default RouterView;
