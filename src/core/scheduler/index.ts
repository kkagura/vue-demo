let isFlushing = false;
const resolvedPromise = Promise.resolve();
const jobQueue = new Set<Function>();

export function queueJob(job: Function) {
  jobQueue.add(job);
  if (isFlushing) return;
  isFlushing = true;
  resolvedPromise
    .then(() => {
      jobQueue.forEach((job) => job());
    })
    .finally(() => {
      isFlushing = false;
      jobQueue.clear();
    });
}

export function nextTick() {
  return new Promise((resolve) => {
    setTimeout(resolve);
  });
}
