interface Getter<T> {
  (): T;
}

interface Setter<T> {
  (newValue: T): void;
}

export interface Reader<T> {
  (): T;
}

export interface Writer<T> {
  (val: T | Setter<T>): void;
}

interface EffectOptions {
  scheduler?: (effectFn: Function) => void;
  lazy?: boolean;
}

export interface ReactiveEffect {
  run: () => any;
  stateEffectSets: Set<ReactiveEffect>[];
  active: boolean;
  stop: () => void;
  options: EffectOptions | null;
}

interface ReactiveState<T> {
  value: T;
  effects: Set<ReactiveEffect>;
}

const effectStack: ReactiveEffect[] = [];
const getCurrentEffect = (): ReactiveEffect | null =>
  effectStack[effectStack.length - 1] || null;

export function createReactive<T>(data: T): [Reader<T>, Writer<T>] {
  const s: ReactiveState<T> = {
    value: data,
    effects: new Set(),
  };

  const read = () => {
    const currentEffect = getCurrentEffect();
    if (currentEffect) {
      s.effects.add(currentEffect);
      currentEffect.stateEffectSets.push(s.effects);
    }
    return s.value;
  };
  const write = (newValue: T | Setter<T>) => {
    if (typeof newValue === "function") {
      (newValue as Setter<T>)(s.value);
    } else {
      if (s.value === newValue) return;
      s.value = newValue;
    }
    const arr = [...s.effects];
    arr.forEach((reactiveEffect) => {
      if (reactiveEffect === getCurrentEffect()) return;
      if (reactiveEffect.options?.scheduler) {
        reactiveEffect.options.scheduler(reactiveEffect.run);
      } else {
        reactiveEffect.run();
      }
    });
  };
  return [read, write];
}

export function createEffect(fn: () => void, options?: EffectOptions) {
  const reactiveEffect: ReactiveEffect = {
    run: () => {
      if (!reactiveEffect.active) return;
      // 每次执行的时候都要清空依赖重新收集因为effect内存在条件分支时，可能每次需要的依赖都不一样
      cleanup(reactiveEffect);
      effectStack.push(reactiveEffect);
      try {
        return fn();
      } finally {
        effectStack.pop();
      }
    },
    stateEffectSets: [],
    active: true,
    stop: () => {
      cleanup(reactiveEffect);
      reactiveEffect.active = false;
    },
    options: options || null,
  };
  if (options?.lazy !== true) {
    reactiveEffect.run();
  }
  return reactiveEffect;
}

interface MemoState<T> {
  dirty: boolean;
  getter: Getter<T>;
  value: T;
}

export function createMemo<T>(getter: Getter<T>): Getter<T> {
  const memoState: MemoState<T> = {
    dirty: true,
    getter,
    value: null as unknown as T,
  };
  const reactiveEffect = createEffect(getter, {
    scheduler() {
      memoState.dirty = true;
    },
    lazy: true,
  });
  const read: Getter<T> = () => {
    if (memoState.dirty) {
      const value: T = reactiveEffect.run();
      memoState.value = value;
      memoState.dirty = false;
    }
    return memoState.value;
  };
  return read;
}

function cleanup(reactiveEffect: ReactiveEffect) {
  reactiveEffect.stateEffectSets.forEach((effects) => {
    effects.delete(reactiveEffect);
  });
}
