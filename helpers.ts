import fs from 'fs';
import path from 'path';

export const loadInput =
  (filename: string): string => {
    return fs.readFileSync(path.resolve(__dirname, filename)).toString();
  };

// Generates an Array containing numbers from start to end.
export const range =
  (start: number, end: number): number[] => {
    const result = [];
    for (let val = start; val <= end; val++) {
      result.push(val);
    }
    return result;
  };

// Given an array and a slice size, splits the array into slices of the given size,
// including a partial slice if the number of elements is not divisible by the slice size.
// eachSlice([1, 2, 3, 4, 5, 6, 7], 2) => [[1, 2], [3, 4], [5, 6], [7]]
export const eachSlice = <T>(arr: T[], sliceSize: number): T[][] => {
  const result = [];
  let slice = [];
  for (let index = 0; index < arr.length; index++) {
    slice.push(arr[index]);
    if (slice.length == sliceSize) {
      result.push(slice);
      slice = [];
    }
  }
  if (slice.length > 0) { result.push(slice); }
  return result;
}

// Given an array of Ts and a consSize, return an array representing a sliding window
// of values from the array of size consSize.
export const eachCons =
  <T>(arr: T[], consSize: number): T[][] => {
    const result = [];
    for (let startIndex = 0; startIndex < arr.length + 1 - consSize; startIndex++) {
      const cons = [];
      for (let consIndex = startIndex; consIndex < startIndex + consSize; consIndex++) {
        cons.push(arr[consIndex]);
      }
      result.push(cons);
    }
    return result;
  };

// Given an array of numbers, return the sum of its elements.
export const sum =
  (arr: number[]): number => {
    return arr.reduce((a, b) => { return a + b; }, 0);
  }

// Copies Ruby's Enumerable#partition. Given a list and a predicate,
// applies the predicate to each element and splits the result into two
// lists: one for which the predicate returns true, and another for which it returns false.
export const partition =
  <T>(arr: T[], predicate: (val: T) => boolean): [T[], T[]] => {
    const base: [T[], T[]] = [[], []];
    return arr.reduce(([trueVals, falseVals], val) => {
      if (predicate(val)) {
        return [trueVals.concat(val), falseVals];
      } else {
        return [trueVals, falseVals.concat(val)]
      }
    }, base)
  }

export const exists =
  <T>(arr: T[], predicate: (val: T) => boolean): boolean => {
    for (const elem of arr) {
      if (predicate(elem)) { return true; }
    }
    return false;
  }

export const every =
  <T>(arr: T[], predicate: (val: T) => boolean): boolean => {
    return !exists(arr, (val) => !predicate(val));
  }

export const find =
  <T>(arr: T[], predicate: (val: T) => boolean): T | undefined => {
    for (const elem of arr) {
      if (predicate(elem)) { return elem; }
    }
    return undefined;
  }

export function tally<T>(items: T[]): Map<T, number> {
    const map = new Map<T, number>();
    items.forEach(elem => {
      if (map.has(elem)) {
        map.set(elem, map.get(elem) + 1);
      } else {
        map.set(elem, 1);
      }
    });
    return map;
  }