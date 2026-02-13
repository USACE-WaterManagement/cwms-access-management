export function intersperse<T, S>(separator: (index: number) => S, array: T[]): (T | S)[] {
  if (array.length === 0) return [];
  if (array.length === 1) return [array[0]];

  const result: (T | S)[] = [array[0]];
  for (let i = 1; i < array.length; i++) {
    result.push(separator(i - 1));
    result.push(array[i]);
  }
  return result;
}
