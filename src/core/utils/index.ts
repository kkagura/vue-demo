export const nextFrame = () => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve(void 0);
      });
    });
  });
};
