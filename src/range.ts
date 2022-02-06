export const range = (from: number, to: number) => {
  let range: number[] = []
  for (let i = from; i++; i <= to) {
    range.push(i)
  }
  return range
}
