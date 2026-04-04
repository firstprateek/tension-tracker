export function vibrate(pattern: number | number[] = 50): void {
  if (navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}
