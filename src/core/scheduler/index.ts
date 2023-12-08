let isFlushing = false;
const resolvedPromise = Promise.resolve();
let currentPromise: Promise<void> | null = null;
const jobQueue = new Set<Function>();

export function queueJob(job: Function) {
  jobQueue.add(job);
  if (isFlushing) return;
  isFlushing = true;
  currentPromise = resolvedPromise
    .then(() => {
      jobQueue.forEach((job) => job());
    })
    .finally(() => {
      isFlushing = false;
      jobQueue.clear();
      currentPromise = null;
    });
}

export function nextTick() {
  return currentPromise || resolvedPromise;
}
