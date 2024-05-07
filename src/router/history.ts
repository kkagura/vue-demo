interface RouterHistory {
  push(to: string): void;
  replace(to: string): void;
  createHref(href: string): string;
}

interface HistoryLocation {}

interface PopState {}

const BEFORE_HASH_RE = /^[^#]+#/;
function createHref(base: string, location: HistoryLocation): string {
  return base.replace(BEFORE_HASH_RE, "#") + location;
}

export function createWebHistory(): RouterHistory {
  const popStateHandler = ({ state }: { state: PopState }) => {
    // console.log(111);
  };
  const changeLocation = (to: string, state: PopState, replace: boolean) => {
    history[replace ? "replaceState" : "pushState"](state, "", to);
  };
  const push = (to: string) => {
    changeLocation(to, {}, false);
  };
  const replace = (to: string) => {
    changeLocation(to, {}, true);
  };
  window.addEventListener("popstate", popStateHandler);
  const routerHistory: RouterHistory = {
    push,
    replace,
    createHref: createHref.bind(null, "/"),
  };
  return routerHistory;
}
