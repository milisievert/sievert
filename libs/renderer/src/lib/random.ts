const arr = new Uint32Array(2);

export function randomBase36() {
  crypto.getRandomValues(arr);
  return arr[0].toString(36) + arr[1].toString(36);
}
