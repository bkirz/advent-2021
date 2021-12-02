import fs from 'fs';

const input = fs.readFileSync('/Users/bkirz/dev/advent_2021/day_1.input');

const range = (start: number, end: number): number[] => {
    const result = [];
    for (let val = start; val <= end; val++) {
        result.push(val);
    }
    return result;
};

const eachCons = <T>(arr: T[], consSize: number): T[][] => {
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

const inputValues: number[] = input.toString().split("\n").map(line => parseInt(line, 10));

const part1NumIncreases =
    eachCons(inputValues, 2)
        .filter((cons) => { return cons[0] < cons[1] })
        .length;

console.log("Part 1: ", part1NumIncreases);

const part2RunSums =
    eachCons(inputValues, 3)
        .map((cons) => cons.reduce((a, b) => { return a + b; }))

const part2NumRunIncreases =
    eachCons(part2RunSums, 2)
        .filter((cons) => { return cons[0] < cons[1] })
        .length;

console.log("Part 2: ", part2NumRunIncreases);