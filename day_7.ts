import { loadInput, minBy, range, sum } from "./helpers";

function calculateTotalDistance(positions: number[], targetPosition: number, distanceFun: (a: number, b: number) => number): number {
    return sum(positions.map(n => distanceFun(n, targetPosition)));
}

function part1Distance(a: number, b: number): number {
    return Math.abs(a - b);
}

function part2Distance(a: number, b: number): number {
    const difference = Math.abs(a - b);
    return (difference * (difference + 1)) / 2;
}

const input: number[] = loadInput('day_7.input').split(',').map(n => parseInt(n));

const [min, max] = [Math.min(...input), Math.max(...input)];
const possibleDistances = range(min, max);

const part1Target = minBy(possibleDistances, (target) => calculateTotalDistance(input, target, part1Distance));
console.log("Part 1 target", part1Target, "distance",  calculateTotalDistance(input, part1Target, part1Distance));

const part2target = minBy(possibleDistances, (target) => calculateTotalDistance(input, target, part2Distance));
console.log("Part 2 target", part2target, "distance",  calculateTotalDistance(input, part2target, part2Distance));