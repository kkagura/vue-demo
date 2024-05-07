import { App, Component, Reader } from "@/core";
import { PathParser } from "./path";

export type RouteMeta = Record<string, unknown>;

export type RouteParamValue = string;
export type RouteParams = Record<string, RouteParamValue | RouteParamValue[]>;

export type LocationQueryValue = string | null | number | undefined;
export type LocationQuery = Record<
  string,
  LocationQueryValue | LocationQueryValue[]
>;

export interface RouteLocationNormalized {
  path: string;
  name?: string;
  params: RouteParams;
  query: LocationQuery;
  fullPath: string;
  meta: RouteMeta;
  matched: RouteRecord | undefined;
}

export interface RouteRecord {
  name: string;
  path: string;
  component: Component;
  meta?: Record<string, unknown>;
}

export interface Router {
  currentRoute: Reader<RouteLocationNormalized>;
  replace(to: RouteLocationRaw): void;
  push(to: RouteLocationRaw): void;
  install(app: App): void;
}

export type RouteRecordMatcher = {
  record: RouteRecord;
} & PathParser;

export interface MatcherLocationAsPath {
  path: string;
}

export interface MatcherLocationAsName {
  name: string;
  params?: RouteLocationNormalized["params"];
}

export type MatcherLocation =
  | {
      name: string;
      params: RouteParams;
      meta: RouteMeta;
      matched: RouteRecord | undefined;
    }
  | {
      path: string;
      params: RouteParams;
      meta: RouteMeta;
      matched: RouteRecord | undefined;
    };

export interface RouteQueryHashParams {
  query?: LocationQuery;
  hash?: string;
  params: RouteParams;
}

export interface RouteLocationOptions {
  replace?: boolean;
}

export type RouteLocationRaw =
  | string
  | ({
      path: string;
    } & RouteLocationOptions)
  | ({ name: string } & RouteQueryHashParams & RouteLocationOptions);
