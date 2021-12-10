import assert from "assert/strict";
import { loadInput } from "./helpers";

const CHARACTER_PAIRS = { "(": ")", "[": "]", "{": "}", "<": ">" };
const OPENERS = Object.keys(CHARACTER_PAIRS);
const POINTS_BY_CORRUPT_CHARACTER = { ")": 3, "]": 57, "}": 1197, ">": 25137 };
const POINTS_PER_MISSING_CLOSER = { ")": 1, "]": 2, "}": 3, ">": 4 };

function pointValue(line: string): number {
    let stack = [];
    for (let index = 0; index < line.length; index++) {
        const character = line.charAt(index);
        if (OPENERS.includes(character)) {
            stack.push(character);
        } else { // This must be a closer
            const expectedCloser = CHARACTER_PAIRS[stack.pop()];
            if (character !== expectedCloser) { return POINTS_BY_CORRUPT_CHARACTER[character]; }
        }
    }
    return 0;
}

function isCorrupt(line: string): boolean { return pointValue(line) !== 0; }

function missingCharacters(line: string): string {
    let stack = [];
    for (let index = 0; index < line.length; index++) {
        const character = line.charAt(index);
        if (OPENERS.includes(character)) {
            stack.push(character);
        } else { // This must be a closer
            const expectedCloser = CHARACTER_PAIRS[stack.pop()];
            assert.strictEqual(character, expectedCloser, "Unexpected mismatch in incomplete line");
        }
    }

    // At this point, our stack contains all remaining unclosed openers.
    return stack.reverse().map(c => CHARACTER_PAIRS[c]).join('');
}

function calcIncompleteScore(missingChars: string): number {
    let score = 0;
    for (let index = 0; index < missingChars.length; index++) {
        score *= 5;
        score += POINTS_PER_MISSING_CLOSER[missingChars.charAt(index)];
    }
    return score;
}

const lines = loadInput("day_10.input").split("\n");
console.log("Part 1", lines.map(pointValue).reduce((a, b) => a + b));

const incompleteLines = lines.filter(l => !isCorrupt(l));
const scores = incompleteLines.map(missingCharacters).map(calcIncompleteScore);
scores.sort((a, b) => a - b);
const middleScoreIndex = (scores.length - 1) / 2;
console.log("Part 2", scores[middleScoreIndex]);