import { loadInput, partition } from './helpers';

type countsArray = Array<number>;

const lineToCountsArray = (line: string): countsArray => {
    return line.split('').map((char) => char === "1" ? 1 : 0);
}

const input = loadInput('day_3.input');
const countsArrays = input.split("\n").map(lineToCountsArray);
const threshold = countsArrays.length / 2;

const calcPart1 = (countsArrays: Array<countsArray>): number => {
    const addCountsArrays = (a: countsArray, b: countsArray): countsArray => {
        const result = [];
        for (let index = 0; index < a.length; index++) {
            result.push(a[index] + b[index]);
        }
        return result;
    }

    const summed = countsArrays.reduce(addCountsArrays);
    const [gamma, epsilon] = summed.reduce(([gamma, epsilon], total) => {
        if (total > threshold) {
            return [gamma + "1", epsilon += "0"];
        } else {
            return [gamma + "0", epsilon += "1"];
        }
    }, ["", ""]);
    return parseInt(gamma, 2) * parseInt(epsilon, 2);
}

const calcPart2 = (countsArrays: Array<countsArray>): number => {
    const calcCandidate = (countsArrays: Array<countsArray>, index: number, calcFilterBit: (totalCount: number, sum: number) => 0|1) => {
        const sumAtIndex = countsArrays.map(arr => arr[index]).reduce((a, b) => a + b);
        const filterBit = calcFilterBit(countsArrays.length, sumAtIndex);
        const candidates = countsArrays.filter((arr) => arr[index] == filterBit);
        if (candidates.length === 1) {
            return parseInt(candidates[0].map(n => n.toString()).join(""), 2);
        } else {
            return calcCandidate(candidates, index + 1, calcFilterBit);
        }
    }

    const oxygenGeneratorRating = calcCandidate(countsArrays, 0, (total, sum) => sum >= total / 2 ? 1 : 0);
    const co2ScrubberRating = calcCandidate(countsArrays, 0, (total, sum) => sum >= total / 2 ? 0 : 1);
    return oxygenGeneratorRating * co2ScrubberRating;
}

console.log("Part 1", calcPart1(countsArrays));
console.log("Part 2", calcPart2(countsArrays));