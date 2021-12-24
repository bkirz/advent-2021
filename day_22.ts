import { loadInput } from "./helpers";

const VOXEL_STATES = ["on", "off"] as const;
type VoxelState = typeof VOXEL_STATES[number];

function isVoxelState(str: string): str is VoxelState {
    return (VOXEL_STATES as readonly string[]).includes(str);
}

const DIMENSIONS: Dimension[] = ['x', 'y', 'z'];

// We can't enforce this using types, but start must be <= end.
type Range = Readonly<{ start: number, end: number }>;

type Voxel = Readonly<{ x: number, y: number, z: number }>;
type Dimension = keyof Voxel;
type Cuboid = Readonly<{ x: Range, y: Range, z: Range }>;
type RebootStep = Readonly<{ state: VoxelState, cuboid: Cuboid }>;

const INPUT_PATTERN = /(on|off) x=(-?\d+)..(-?\d+),y=(-?\d+)..(-?\d+),z=(-?\d+)..(-?\d+)/;

function* voxelsInCuboid(cuboid: Cuboid) {
    for (let x = cuboid.x.start; x < cuboid.x.end; x++) {
        for (let y = cuboid.y.start; y < cuboid.y.end; y++) {
            for (let z = cuboid.z.start; z < cuboid.z.end; z++) {
                yield { x, y, z };
            }
        }
    }
}

function isVoxelInCuboid(voxel: Voxel, cuboid: Cuboid) {
    return DIMENSIONS.every(dim => cuboid[dim].start <= voxel[dim] && voxel[dim] <= cuboid[dim].end);
}

function voxelState(voxel: Voxel, steps: RebootStep[]): VoxelState {
    return steps.reduce((currentState: VoxelState, step: RebootStep) => {
        const testResult = isVoxelInCuboid(voxel, step.cuboid);
        if (voxel.x === 0 && voxel.y === 0 && voxel.z === 0) {
            console.log("Origin tested against", step, "with result", testResult);
        }
        return testResult ? step.state : currentState;
    }, "off");
}

function countVoxelsThatAreOn(steps: RebootStep[], bounds: Cuboid): number {
    let count = 0;
    for (const voxel of voxelsInCuboid(bounds)) {
        const state = voxelState(voxel, steps);
        if (state === "on") { count++; }
    }
    return count;
}

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

const part1Range = {
    x: { start: -50, end: 50 },
    y: { start: -50, end: 50 },
    z: { start: -50, end: 50 },
};

console.log("Part 1", countVoxelsThatAreOn(steps, part1Range));