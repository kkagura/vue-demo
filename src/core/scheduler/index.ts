let isFlushing = false;
const resolvedPromise = Promise.resolve();
const jobQueue = new Set<Function>();

export function queueJob(job: Function) {
  if (isFlushing) return;
  isFlushing = true;
  jobQueue.add(job);
  resolvedPromise
    .then(() => {
      jobQueue.forEach((job) => job());
    })
    .finally(() => {
      isFlushing = false;
      jobQueue.clear();
    });
}
