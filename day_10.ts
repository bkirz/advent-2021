import { loadInput } from "./helpers";

const CHARACTER_PAIRS = { "(": ")", "[": "]", "{": "}", "<": ">" };
const OPENERS = Object.keys(CHARACTER_PAIRS);
const POINTS_BY_CHARACTER = { ")": 3, "]": 57, "}": 1197, ">": 25137 };

function pointValue(line: string): number {
    let stack = [];
    for (let index = 0; index < line.length; index++) {
        const character = line.charAt(index);
        if (OPENERS.includes(character)) {
            stack.push(character);
        } else { // This must be a closer
            const expectedCloser = CHARACTER_PAIRS[stack.pop()];
            if (character !== expectedCloser) { return POINTS_BY_CHARACTER[character]; }
        }
    }
    return 0;
}

const lines = loadInput("day_10.input").split("\n");
console.log("Part 1", lines.map(pointValue).reduce((a, b) => a + b));