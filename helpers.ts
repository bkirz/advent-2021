import fs from 'fs';
import path from 'path';

export const loadInput =
  (filename: string): string => {
    return fs.readFileSync(path.resolve(__dirname, filename)).toString();
  };

// Generates an Array containing numbers from start to end, inclusive.
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
export function eachCons<T>(arr: T[], consSize: number): T[][] {
  const result = [];
  for (let startIndex = 0; startIndex < arr.length + 1 - consSize; startIndex++) {
    const cons = [];
    for (let consIndex = startIndex; consIndex < startIndex + consSize; consIndex++) {
      cons.push(arr[consIndex]);
    }
    result.push(cons);
  }
  return result;
}

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
        return [[...trueVals, val], falseVals];
      } else {
        return [trueVals, [...falseVals, val]];
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

export const indexOf =
  <T>(arr: T[], predicate: (val: T) => boolean): number => {
    for (let index = 0; index < arr.length; index++) {
      if (predicate(arr[index])) { return index; }
    }
    return -1;
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

export function tallyBy<T>(items: Iterable<T>, hashFn: (elem: T) => string): ImmutableHashMap<T, number> {
    const countsByHash = new Map<string, number>();
    for (const elem of items) {
      const hash = hashFn(elem);
      if (countsByHash.has(hash)) {
        countsByHash.set(hash, countsByHash.get(hash) + 1);
      } else {
        countsByHash.set(hash, 1);
      }
    }

    return new ImmutableHashMap<T, number>(hashFn, [...items].map(elem => [elem, countsByHash.get(hashFn(elem))]));
}

export function minBy<T, U>(items: T[], transform: (elem: T) => U): T | undefined {
  if (items.length === 0) { return undefined; }
  return items.reduce((a, b) => transform(a) < transform(b) ? a : b);
}

export function maxBy<T, U>(items: T[], transform: (elem: T) => U): T | undefined {
  if (items.length === 0) { return undefined; }
  return items.reduce((a, b) => transform(a) > transform(b) ? a : b);
}

export function identity(x: any) { return x; }

export function minmax<T>(items: Iterable<T>, transform: (elem: T) => number = identity): [T, T] {
  if ([...items].length === 0) { throw new Error("Can't calculate minmax on an empty input."); }

  let min = Number.MAX_VALUE;
  let minElem = undefined;
  let max = Number.MIN_VALUE;
  let maxElem = undefined;

  for (const elem of items) {
    const numeric = transform(elem);
    if (numeric <= min) { min = numeric; minElem = elem; }
    if (numeric >= max) { max = numeric; maxElem = elem; }
  }

  return [minElem, maxElem];
}

export type HashValue = string | number;
export interface Hashable { hash: () => HashValue; };

export class ImmutableSet<T extends Hashable> {
  private _map: Map<HashValue, T>;

  constructor(values: Iterable<T>) {
    this._map = new Map([...values].map(v => [v.hash(), v]));
  }

  add(value: T) { return new ImmutableSet([...this, value]); }
  has(value: T) { return this._map.has(value.hash()); }

  [Symbol.iterator](): Iterator<T, any, undefined> { return this._map.values(); }
}

export class ImmutableHashSet<T> implements Iterable<T> {
  // Because Javascript Sets and Maps don't support custom object hashing for
  // builtin maps and sets, we can implement a Set via map of Hash(T) => T.
  private _map: Map<string, T>;
  hashFn: (elem: T) => string;

  constructor(hashFn: (elem: T) => string, elems?: Iterable<T>) {
      this.hashFn = hashFn;
      if (elems === undefined) {
          this._map = new Map();
      } else {
          this._map = new Map([...elems].map(e => [hashFn(e), e]));
      }
  }

  add(elem: T): ImmutableHashSet<T> {
      return this.newWithSameHash([...this, elem]);
  }

  merge(elems: Iterable<T>): ImmutableHashSet<T> {
      return this.newWithSameHash([...this, ...elems]);
  }

  subtract(toSubtract: ImmutableHashSet<T>): ImmutableHashSet<T> {
      return this.filter(e => !toSubtract.has(e));
  }

  delete(elem: T): ImmutableHashSet<T> {
      const newElems = [...this._map.entries()].filter(([key, val]) => key !== this.hashFn(elem)).map(([_, val]) => val);
      return this.newWithSameHash(newElems);
  }

  filter(predicate: (elem: T) => boolean): ImmutableHashSet<T> {
      return this.newWithSameHash([...this._map.values()].filter(predicate));
  }

  partition(predicate: (elem: T) => boolean): [ImmutableHashSet<T>, ImmutableHashSet<T>] {
      const trueSet = [];
      const falseSet = [];
      for (const val of this._map.values()) {
          predicate(val) ? trueSet.push(val) : falseSet.push(val);
      }
      return [
          this.newWithSameHash(trueSet),
          this.newWithSameHash(falseSet),
      ];
  }

  map(transform: (elem: T) => T): ImmutableHashSet<T> {
    return this.newWithSameHash([...this._map.values()].map(transform));
  }

  flatMap(transform: (elem: T) => Iterable<T>): ImmutableHashSet<T> {
      return this.newWithSameHash([...this._map.values()].flatMap(val => [...transform(val)]));
  }

  has(elem: T): boolean { return this._map.has(this.hashFn(elem)); }
  size(): number { return this._map.size; }

  toString(): string { return `ImmutableHashSet(${[...this._map.values()]})`; }
  [Symbol.iterator](): Iterator<T, any, undefined> { return this._map.values(); }

  private newWithSameHash(elems: Iterable<T>): ImmutableHashSet<T> {
      return new ImmutableHashSet(this.hashFn, elems);
  }
}

export class ImmutableHashMap<K, V> implements Iterable<[K, V]> {
  private readonly _map: Map<string, [K, V]>;
  private readonly hashFn: (key: K) => string;

  constructor(hashFn: (key: K) => string, initialElements: Iterable<[K, V]> = []) {
    this.hashFn = hashFn;
    this._map = new Map<string, [K, V]>([...initialElements].map(([k, v]) => [hashFn(k), [k, v]]));
  }

  size(): number { return this._map.size; }

  // TODO: This should really return a map of different types, but that messes up the underlying
  // hash function unless a new one is provided. Accepting a hash separately from the type sucks. :(
  flatMap(transform: (k: K, v: V) => Iterable<[K, V]>): ImmutableHashMap<K, V> {
    const newEntries = [...this._map].flatMap(([hash, [k, v]]: [string, [K, V]]) => [...transform(k, v)]);
    return new ImmutableHashMap(this.hashFn, newEntries);
  }

  mapEntries(transform: (k: K, v: V) => [K, V]): ImmutableHashMap<K, V> {
    const newEntries = [...this._map].map(([_, [k, v]]): [K, V] => transform(k, v));
    return new ImmutableHashMap(this.hashFn, newEntries);
  }

  mapValues(transform: (v: V) => V): ImmutableHashMap<K, V> {
    const newEntries = [...this._map].map(([_, [k, v]]): [K, V] => [k, transform(v)]);
    return new ImmutableHashMap(this.hashFn, newEntries);
  }

  get(key: K): V { return this._map.get(this.hashFn(key))[1]; }
  has(key: K): boolean { return this._map.has(this.hashFn(key)); }

  set(key: K, value: V): ImmutableHashMap<K, V> {
    return new ImmutableHashMap<K, V>(this.hashFn, [...this._map.values(), [key, value]]);
  }

  update(key: K, valueIfMissing: V, transform: (val: V) => V): ImmutableHashMap<K, V> {
    if (this.has(key)) {
      return this.set(key, transform(this.get(key)));
    } else {
      return this.set(key, valueIfMissing);
    }
  }

  merge(other: Iterable<[K, V]>, onCollision: (key: K, my: V, their: V) => V): ImmutableHashMap<K, V> {
    let newMap: Map<string, [K, V]> = new Map(this._map);
    for (const [key, val] of other) {
      const hash = this.hashFn(key);
      if (newMap.has(hash)) {
        newMap.set(hash, [key, onCollision(key, newMap.get(hash)[1], val)]);
      } else {
        newMap.set(hash, [key, val]);
      }
    }
    return new ImmutableHashMap<K, V>(this.hashFn, newMap.values());
  }

  filter(predicate: (key: K, value: V) => boolean): ImmutableHashMap<K, V> {
    return new ImmutableHashMap(this.hashFn, [...this._map.values()].filter(([k, v]) => predicate(k, v)));
  }

  partition(predicate: (key: K, value: V) => boolean): [ImmutableHashMap<K, V>, ImmutableHashMap<K, V>] {
    const [trueEntries, falseEntries] = partition([...this._map.values()], ([key, val]) => predicate(key, val));
    return [new ImmutableHashMap(this.hashFn, trueEntries), new ImmutableHashMap(this.hashFn, falseEntries)];
  }

  entries(): Iterable<[K, V]> { return this._map.values(); }
  keys(): Iterable<K> { return [...this.entries()].map(([key, _]) => key); }
  values(): Iterable<V> { return [...this.entries()].map(([_, val]) => val); }
  [Symbol.iterator](): Iterator<[K, V], any, undefined> { return this.entries()[Symbol.iterator](); }
}
