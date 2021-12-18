import assert from "assert";
import { loadInput } from "./helpers";

interface DimensionState { readonly position: number; readonly velocity: number };

interface ProbeState { readonly x: DimensionState; readonly y: DimensionState; readonly step: number };

interface Range { readonly min: number; readonly max: number; };
interface TargetArea {
    readonly x: Range;
    readonly y: Range;
}

interface StartVelocity { readonly x: number, readonly y: number };

interface SuccessfulSimulation {
    readonly type: "success";
    readonly states: ProbeState[];
    readonly startVelocity: StartVelocity;
};
interface FailedSimulation {
    readonly type: "failure";
    readonly startVelocity: StartVelocity;
};
type Simulation = SuccessfulSimulation | FailedSimulation;

function determineSimulationBounds(target: TargetArea): { x: Range, y: Range } {
    return {
        x: { min: 0, max: target.x.max },
        y: { min: Math.min(-target.y.min, target.y.min), max: Math.max(-target.y.min, target.y.min)},
    };
}

// Given a start velocity and target area, return either a successful series of steps in which
// the probe steps through the target area, or a failure if it misses entirely.
function simulate(startVelocity: StartVelocity, target: TargetArea): Simulation {
    function step(probeState: ProbeState): ProbeState {
        return {
            step: probeState.step + 1,
            x: {
                position: probeState.x.position + probeState.x.velocity,
                velocity: Math.max(probeState.x.velocity - 1, 0),
            },
            y: {
                position: probeState.y.position + probeState.y.velocity,
                velocity: probeState.y.velocity - 1,
            }
        };
    }

    function isInTarget(state: ProbeState, target: TargetArea): boolean {
        return (target.x.max >= state.x.position && state.x.position >= target.x.min) &&
               (target.y.max >= state.y.position && state.y.position >= target.y.min)
    }

    function isPastTarget(probeState: ProbeState): boolean {
        return probeState.y.position < target.y.min && probeState.y.velocity <= 0;
    }

    let currentState: ProbeState = {
        step: 0,
        x: { position: 0, velocity: startVelocity.x },
        y: { position: 0, velocity: startVelocity.y },
    };

    const states = [];
    let targetCrossed = false;

    while(!isPastTarget(currentState)) {
        if (isInTarget(currentState, target)) { targetCrossed = true; }

        states.push(currentState);
        currentState = step(currentState);
    }

    return targetCrossed ? { type: "success", startVelocity, states } : { type: "failure" , startVelocity };
}

function findSuccessfulSimulations(target: TargetArea): SuccessfulSimulation[] {
    const bounds = determineSimulationBounds(target);

    const successfulSimulations: SuccessfulSimulation[] = [];
    for (let x = bounds.x.min; x <= bounds.x.max; x++) {
        for (let y = bounds.y.min; y <= bounds.y.max; y++) {
            const startVelocity = {x, y};
            const simulation = simulate(startVelocity, target);
            if ( simulation.type === "success" ) { successfulSimulations.push(simulation) };
        }
    }

    return successfulSimulations;
}

function findMaxHeight(target: TargetArea): number {
    function maxHeight(simulation: SuccessfulSimulation): number {
        return Math.max(...simulation.states.map(s => s.y.position));
    };

    const simulations = findSuccessfulSimulations(target);
    assert(simulations.length > 0, "Found no successful simulations");
    return Math.max(...simulations.map(maxHeight));
}

const INPUT_PATTERN = /target area: x=(-?\d+)..(-?\d+), y=(-?\d+)..(-?\d+)/;
const input = loadInput('day_17.input');

const [_, xMin, xMax, yMin, yMax] = input.match(INPUT_PATTERN);
const target: TargetArea = {
    x: { min: parseInt(xMin), max: parseInt(xMax) },
    y: { min: parseInt(yMin), max: parseInt(yMax) },
}

console.log("Part 1", findMaxHeight(target));
console.log("Part 2", findSuccessfulSimulations(target).length);