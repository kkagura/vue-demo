import { getCurrentInstance } from ".";

export interface InjectionKey<T> extends Symbol {}

export interface Provides {
  [key: string | symbol]: any;
}

export function provide<T>(key: string | InjectionKey<T>, value: T) {
  const instance = getCurrentInstance();
  if (!instance) {
    return;
  }
  instance.provides[key as string | symbol] = value;
}

export function inject<T>(key: InjectionKey<T>): T | undefined;
export function inject<T>(key: InjectionKey<T>, defaultVal: T): T;
export function inject<T>(key: string): T | undefined;
export function inject<T>(key: string, defaultVal: T): T;

export function inject(key: InjectionKey<any> | string, defaultVal?: unknown) {
  const instance = getCurrentInstance();
  if (!instance) {
    return;
  }
  const injectionKey = key as string | symbol;
  if (injectionKey in instance.provides) {
    return instance.provides[injectionKey];
  }
  if (arguments.length > 1) return defaultVal;
}
