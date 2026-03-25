export function generateId(): string {
  const array = new Uint32Array(1)
  globalThis.crypto.getRandomValues(array)
  return `${Date.now()}-${array[0]}`
}
