import { tokenizePath, tokensToParser } from "./path";
import {
  MatcherLocation,
  MatcherLocationAsName,
  MatcherLocationAsPath,
  RouteParams,
  RouteRecord,
  RouteRecordMatcher,
} from "./type";

function createRouteRecordMatcher(record: RouteRecord): RouteRecordMatcher {
  const parser = tokensToParser(tokenizePath(record.path));
  const matcher: RouteRecordMatcher = Object.assign(parser, {
    record,
  });
  return matcher;
}

export function createRouterMatcher(routes: RouteRecord[]) {
  const matchers: RouteRecordMatcher[] = [];
  const matcherMap = new Map<string, RouteRecordMatcher>();

  function addRoute(record: RouteRecord) {
    const matcher = createRouteRecordMatcher(record);
    matchers.push(matcher);
    matcherMap.set(record.name, matcher);
  }

  function resolve(
    location: string | MatcherLocationAsPath | MatcherLocationAsName,
    currentLocation: MatcherLocation
  ) {
    if (typeof location === "string") {
      location = { path: location };
    }
    let matcher: RouteRecordMatcher | undefined;
    let params: RouteParams = {};
    let path: string;
    let name: string;
    if ("name" in location) {
      matcher = matcherMap.get(location.name);
      if (!matcher) {
        // throw error
        throw new Error("404");
      }
      name = matcher.record.name;
      params = Object.assign(
        // paramsFromLocation is a new object
        paramsFromLocation(
          currentLocation.params,
          // only keep params that exist in the resolved location
          // TODO: only keep optional params coming from a parent record
          matcher.keys.filter((k) => !k.optional).map((k) => k.name)
        ),
        // discard any existing params in the current location that do not exist here
        // #1497 this ensures better active/exact matching
        location.params &&
          paramsFromLocation(
            location.params,
            matcher.keys.map((k) => k.name)
          )
      );
      // throws if cannot be stringified
      path = matcher.stringify(params);
    } else if ("path" in location) {
      path = location.path;
      matcher = matchers.find((m) => m.re.test(path));
      if (matcher) {
        // we know the matcher works because we tested the regexp
        params = matcher.parse(path)!;
        name = matcher.record.name;
      } else {
        throw new Error("404");
      }
    } else {
      matcher =
        "name" in currentLocation
          ? matcherMap.get(currentLocation.name)
          : matchers.find((m) => m.re.test(currentLocation.path));
      if (!matcher) {
        throw new Error("404");
      }
      name = matcher.record.name;
      // since we are navigating to the same location, we don't need to pick the
      // params like when `name` is provided
      params = Object.assign(
        {},
        currentLocation.params,
        (location as any).params
      );
      path = matcher.stringify(params);
    }
    const matched: MatcherLocation["matched"] = matcher?.record;
    return {
      name,
      path,
      params,
      matched,
      meta: matcher.record.meta,
    };
  }

  routes.forEach((r) => addRoute(r));
  return { addRoute, resolve };
}

function paramsFromLocation(
  params: MatcherLocation["params"],
  keys: string[]
): MatcherLocation["params"] {
  const newParams = {} as MatcherLocation["params"];

  for (const key of keys) {
    if (key in params) newParams[key] = params[key];
  }

  return newParams;
}
