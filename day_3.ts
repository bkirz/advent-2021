import { loadInput } from './helpers';

// bit index is array position, value is number of set bits
type countsArray = Array<number>;

const lineToCountsArray =
    (line: string): countsArray => {
        return line.split('').map((char) => char === "1" ? 1 : 0);
    }

const addCountsArrays =
    (a: countsArray, b: countsArray): countsArray => {
        const result = [];
        for (let index = 0; index < a.length; index++) {
            result.push(a[index] + b[index]);
        }
        return result;
    }

const input = loadInput('day_3.input');
const countsArrays = input.split("\n").map(lineToCountsArray);
const summed = countsArrays.reduce(addCountsArrays);
const threshold = countsArrays.length / 2;

let gamma = "";
let epsilon = "";
summed.forEach((total) => {
    if (total > threshold) {
        gamma += "1"; epsilon += "0";
    } else {
        epsilon += "1"; gamma += "0";
    }
});
const result = parseInt(gamma, 2) * parseInt(epsilon, 2);
console.log(result);