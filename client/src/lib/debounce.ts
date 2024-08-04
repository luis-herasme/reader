export function debounce<T extends any[]>(fn: (...args: T) => any, ms = 300) {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (...args: T) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}
