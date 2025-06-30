export const do_ = <A>(k: () => A): A => k();

export const GeneratorOfIterable: <T>(iterator: Iterable<T>) => Generator<T> =
  function* (iterator) {
    for (const x of iterator) yield x;
  };

// const x = GeneratorOfIterable(new Map<string, number>().entries());
const x = Array.from(new Map<string, number>().values());
// const x = [...new Map<string, number>().values()];

export const deepcopy = <A>(x: A): A => JSON.parse(JSON.stringify(x));

export function toReadOnlyArray<A>(xs: A[]): readonly A[] {
  return Object.freeze(xs);
}
