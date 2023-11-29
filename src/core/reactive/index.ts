interface Setter<T> {
  (newValue: T): void;
}

interface Reader<T> {
  (): T;
}

interface Writer<T> {
  (val: T | Setter<T>): void;
}

export interface ReactiveEffect {
  run: () => void;
  stateEffectSets: Set<ReactiveEffect>[];
  active: boolean;
  stop: () => void;
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
      s.value = newValue;
    }
    const arr = [...s.effects];
    arr.forEach((reactiveEffect) => {
      if (reactiveEffect === getCurrentEffect()) return;
      reactiveEffect.run();
    });
  };
  return [read, write];
}
export function createEffect(fn: () => void) {
  const reactiveEffect: ReactiveEffect = {
    run: () => {
      if (!reactiveEffect.active) return;
      // 每次执行的时候都要清空依赖重新收集因为effect内存在条件分支时，可能每次需要的依赖都不一样
      cleanup(reactiveEffect);
      effectStack.push(reactiveEffect);
      try {
        fn();
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
  };
  reactiveEffect.run();
  return reactiveEffect;
}

function cleanup(reactiveEffect: ReactiveEffect) {
  reactiveEffect.stateEffectSets.forEach((effects) => {
    effects.delete(reactiveEffect);
  });
}
