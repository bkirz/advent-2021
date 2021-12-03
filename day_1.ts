import { eachCons, loadInput, sum } from './helpers';

const input = loadInput('day_1.input');
const inputValues: number[] = input.toString().split("\n").map(line => parseInt(line, 10));

const part1NumIncreases =
    eachCons(inputValues, 2)
        .filter((cons) => { return cons[0] < cons[1] })
        .length;

console.log("Part 1: ", part1NumIncreases);

const part2RunSums =
    eachCons(inputValues, 3)
        .map((cons) => sum(cons));

const part2NumRunIncreases =
    eachCons(part2RunSums, 2)
        .filter((cons) => { return cons[0] < cons[1] })
        .length;

console.log("Part 2: ", part2NumRunIncreases);
