import assert from "assert";
import { loadInput } from "./helpers";

const VOXEL_STATES = ["on", "off"] as const;
type VoxelState = typeof VOXEL_STATES[number];
function isVoxelState(str: string): str is VoxelState {
    return (VOXEL_STATES as readonly string[]).includes(str);
}

type Range = Readonly<{ start: number, end: number }>;

type Voxel = Readonly<{ x: number, y: number, z: number }>;
type Dimension = keyof Voxel;
type Cuboid = Readonly<{ x: Range, y: Range, z: Range }>;
type RebootStep = Readonly<{ state: VoxelState, cuboid: Cuboid }>;
type Plane = Readonly<{ dimension: Dimension, position: number }>;

const DIMENSIONS: Dimension[] = ['x', 'y', 'z'];

class ImmutableHashSet<T> implements Iterable<T> {
    // Because Javascript Sets and Maps don't support custom object hashing for
    // builtin maps and sets, we can implement a Set via map of Hash(T) => T.
    private map: Map<string, T>;
    private hashFn: (elem: T) => string;

    constructor(hashFn: (elem: T) => string, elems?: Iterable<T>) {
        this.hashFn = hashFn;
        if (elems === undefined) {
            this.map = new Map();
        } else {
            this.map = new Map([...elems].map(e => [hashFn(e), e]));
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
        const newElems = [...this.map.entries()].filter(([key, val]) => key !== this.hashFn(elem)).map(([_, val]) => val);
        return this.newWithSameHash(newElems);
    }

    filter(predicate: (elem: T) => boolean): ImmutableHashSet<T> {
        return this.newWithSameHash([...this.map.values()].filter(predicate));
    }

    partition(predicate: (elem: T) => boolean): [ImmutableHashSet<T>, ImmutableHashSet<T>] {
        const trueSet = [];
        const falseSet = [];
        for (const val of this.map.values()) {
            predicate(val) ? trueSet.push(val) : falseSet.push(val);
        }
        return [
            this.newWithSameHash(trueSet),
            this.newWithSameHash(falseSet),
        ];
    }

    flatMap(transform: (elem: T) => Iterable<T>): ImmutableHashSet<T> {
        return this.newWithSameHash([...this.map.values()].flatMap(val => [...transform(val)]));
    }

    has(elem: T): boolean { return this.map.has(this.hashFn(elem)); }
    size(): number { return this.map.size; }

    toString(): string { return `ImmutableHashSet(${[...this.map.values()]})`; }
    [Symbol.iterator](): Iterator<T, any, undefined> { return this.map.values(); }

    private newWithSameHash(elems: Iterable<T>): ImmutableHashSet<T> {
        return new ImmutableHashSet(this.hashFn, elems); 
    }
}

// The simple and obvious solution that works for part 1 but doesn't scale for part 2:
// iterate over every voxel within the bounds of the problem, iteratively apply each step
// and test if it is turned on/off.
function naivelyCountVoxelsThatAreOn(steps: RebootStep[], bounds: Cuboid): number {
    function isVoxelInCuboid(voxel: Voxel, cuboid: Cuboid) {
        return DIMENSIONS.every(dim => cuboid[dim].start <= voxel[dim] && voxel[dim] <= cuboid[dim].end);
    }

    function* allVoxelsInCuboid(cuboid: Cuboid) {
        for (let x = cuboid.x.start; x < cuboid.x.end; x++) {
            for (let y = cuboid.y.start; y < cuboid.y.end; y++) {
                for (let z = cuboid.z.start; z < cuboid.z.end; z++) {
                    yield { x, y, z };
                }
            }
        }
    }

    function voxelState(voxel: Voxel, steps: RebootStep[]): VoxelState {
        return steps.reduce((currentState: VoxelState, step: RebootStep) => {
            const testResult = isVoxelInCuboid(voxel, step.cuboid);
            return testResult ? step.state : currentState;
        }, "off");
    }

    let count = 0;
    for (const voxel of allVoxelsInCuboid(bounds)) {
        const state = voxelState(voxel, steps);
        if (state === "on") { count++; }
    }
    return count;
}

function formatCuboid(cuboid: Cuboid): string {
    const dims = DIMENSIONS.map(dim => `${cuboid[dim].start}..${cuboid[dim].end}`)
    return `[${dims.join(',')}]`;
}

function newCuboidSet(cuboids: Iterable<Cuboid>): ImmutableHashSet<Cuboid> {
    return new ImmutableHashSet<Cuboid>(formatCuboid, cuboids);
}

function cuboidsIntersect(a: Cuboid, b: Cuboid): boolean {
    return !DIMENSIONS.find(dim => a[dim].end < b[dim].start || b[dim].end < a[dim].start);
}

function cuboidVolume(c: Cuboid): number {
    return DIMENSIONS.map(dim => c[dim].end - c[dim].start + 1).reduce((a, b) => a * b);
}

function planeBisectsCuboid(cuboid: Cuboid, {dimension: dim, position: pos}: Plane): boolean {
    return cuboid[dim].start < pos && pos <= cuboid[dim].end;
}

function applyCut(cuboid: Cuboid, cut: Plane): Cuboid[] {
    // Given a cuboid and a plane, bisects the cuboid and returns the two halves.
    // If the plane does not intersect the cuboid, returns the original cuboid.
    if (planeBisectsCuboid(cuboid, cut)) {
        const {dimension: dim, position: pos} = cut;
        return [
            { ...cuboid, [dim]: { start: cuboid[dim].start, end: pos - 1 } },
            { ...cuboid, [dim]: { start: pos, end: cuboid[dim].end } },
        ];
    } else {
        return [cuboid];
    }
}

// Given a cuboid to be sliced and a slicer cuboid, returns a collection of cuboids such that:
// - All of the returned cuboids are disjoint
// - The returned cuboids collectively occupy the same coordinate space as the sliced cuboid
// - For any given return cuboid, it either does not overlap the slicer cuboid or is a subset of the slicer.
function sliceCuboid(sliced: Cuboid, slicer: Cuboid): ImmutableHashSet<Cuboid> {
    const planes = DIMENSIONS.flatMap((dim: Dimension) => {
        const possibleCuts: Plane[] = [
            { dimension: dim, position: slicer[dim].start },
            { dimension: dim, position: slicer[dim].end + 1 },
        ]
        // Filter out cuts that don't actually split the sliced cube.
        return possibleCuts.filter((plane: Plane) => planeBisectsCuboid(sliced, plane));
    });

    return newCuboidSet(planes.reduce((cuboids: Cuboid[], plane: Plane) => cuboids.flatMap(cuboid => applyCut(cuboid, plane)), [sliced]));
}

function addCuboid(cuboidSet: ImmutableHashSet<Cuboid>, newCuboid: Cuboid): ImmutableHashSet<Cuboid> {
    const intersections: ImmutableHashSet<Cuboid> = cuboidSet.filter(cuboid => cuboidsIntersect(cuboid, newCuboid));

    let newCuboids = newCuboidSet([newCuboid]);
    for (const intersection of intersections) {
        newCuboids = subtractCuboid(newCuboids, intersection);
    }

    return cuboidSet.merge(newCuboids);
}

function subtractCuboid(cuboidSet: ImmutableHashSet<Cuboid>, subtrahend: Cuboid): ImmutableHashSet<Cuboid> {
    const [intersections, rest]: [ImmutableHashSet<Cuboid>, ImmutableHashSet<Cuboid>] =
        cuboidSet.partition(cuboid => cuboidsIntersect(cuboid, subtrahend));

    // For each intersection, slice up the cube in the set and the new cube. Return new cubes not in the cubes to subtract.
    const cuboidsAfterSubtraction: ImmutableHashSet<Cuboid> = newCuboidSet([...intersections].flatMap(cuboid => {
        const slicedUpCuboid = sliceCuboid(cuboid, subtrahend);
        const slicedUpSubtrahend = sliceCuboid(subtrahend, cuboid);
        return [...slicedUpCuboid.subtract(slicedUpSubtrahend)];
    }));

    return rest.merge(cuboidsAfterSubtraction);
}

function countVoxelsThatAreOnMoreEfficiently(steps: RebootStep[]): number {
    let onCuboids = newCuboidSet([]);

    for (const step of steps) {
        const {state, cuboid} = step;
        switch(state) {
            case 'on':
                console.log("adding cuboid:", formatCuboid(cuboid))
                onCuboids = addCuboid(onCuboids, cuboid);
                break;
            case 'off':
                console.log("subtracting cuboid:", formatCuboid(cuboid))
                onCuboids = subtractCuboid(onCuboids, cuboid);
                break;
        }
    }

    return [...onCuboids].map(cuboidVolume).reduce((a, b) => a + b, 0);
}

const INPUT_PATTERN = /(on|off) x=(-?\d+)..(-?\d+),y=(-?\d+)..(-?\d+),z=(-?\d+)..(-?\d+)/;

const input = loadInput('day_22.input');
const steps: RebootStep[] = input.split("\n").map(line => {
    const [_, state, xStart, xEnd, yStart, yEnd, zStart, zEnd] = INPUT_PATTERN.exec(line);
    if (!isVoxelState(state)) { throw new Error(`Invalied state ${state}`) }
    const voxelState: VoxelState = state;

    return {
        state: voxelState,
        cuboid: {
            x: { start: parseInt(xStart), end: parseInt(xEnd) },
            y: { start: parseInt(yStart), end: parseInt(yEnd) },
            z: { start: parseInt(zStart), end: parseInt(zEnd) },
        },
    };
});

const part1Bounds: Cuboid = {
    x: { start: -50, end: 50 },
    y: { start: -50, end: 50 },
    z: { start: -50, end: 50 },
};

console.log("Part 1", naivelyCountVoxelsThatAreOn(steps, part1Bounds));
console.log("Part 2", countVoxelsThatAreOnMoreEfficiently(steps));