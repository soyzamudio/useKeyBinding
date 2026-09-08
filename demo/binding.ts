/** Option/Alt can change the produced character; bind letter/digit shortcuts by position. */
export function getDemoBinding(keys: readonly string[]) {
  const key = keys[keys.length - 1] ?? "";
  const useCode = keys.some(modifier => modifier === "alt" || modifier === "option")
    && /^[a-z0-9]$/i.test(key);
  const code = /^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : `Digit${key}`;
  return { keys: useCode ? [...keys.slice(0, -1), code] : [...keys], useCode };
}
