import { isDeepStrictEqual } from "util";
import { loadInput, indexOf } from "./helpers";

type Segment = string;
type Digit = Segment[];

interface DisplayEntry {
    uniqueDigits: Digit[];
    outputValue: [Digit, Digit, Digit, Digit];
}

function parseEntry(line: string): DisplayEntry {
    const [uniqueDigitString, outputValueString] = line.split("|", 2);
    const uniqueDigits = uniqueDigitString.trim().split(" ", 10).map(segments => segments.split("").sort());
    const [d1, d2, d3, d4] = outputValueString.split(" ").filter(s => s !== "").map(segments => segments.split("").sort());
    return {uniqueDigits, outputValue: [d1, d2, d3, d4]};
}

function part1(entries: DisplayEntry[]): number {
    const UNIQUE_DIGIT_LENGTHS = [2, 3, 4, 7];
    function isDigitWithUniqueLength(digit: Digit): boolean {
        return UNIQUE_DIGIT_LENGTHS.includes(digit.length);
    }

    return entries.flatMap(entry => entry.outputValue).filter(isDigitWithUniqueLength).length;
}

function part2(entries: DisplayEntry[]): number {
    type DisambiguatedDigits = [Digit, Digit, Digit, Digit, Digit, Digit, Digit, Digit, Digit, Digit];
    function digitContainsSegments(a: Digit, b: Digit): boolean {
        return b.every(segment => a.includes(segment));
    }

    function mapDigitToBase10(digit: Digit, disambiguatedDigits: DisambiguatedDigits): number {
        const index = indexOf(disambiguatedDigits, (d) => isDeepStrictEqual(d, digit));
        return index;
    }

    function calculateOutputValue(entry: DisplayEntry): number {
        function disambiguateDigits(uniqueDigits: Digit[]): DisambiguatedDigits {
            // Goal is to disambiguate all digits, not necessarily to identify every segment.
            // Three are uniquely identifiable by segment count: (1, 4, 7, 8)
            const one = entry.uniqueDigits.find(d => d.length === 2);
            const four = entry.uniqueDigits.find(d => d.length === 4);
            const seven = entry.uniqueDigits.find(d => d.length === 3);
            const eight = entry.uniqueDigits.find(d => d.length === 7);

            // 0, 6, and 9 have six segments each
            const sixSegmentDigits = entry.uniqueDigits.filter(d => d.length === 6);

            // 2, 3, 5 have five segments each
            const fiveSegmentDigits = entry.uniqueDigits.filter(d => d.length === 5);

            // If we consider digits to be sets of segments, we can do set math to uniquely identify them
            // 3 is the only 5-segment digit that includes both segments in 1. (1, 3, 4, 7, 8)
            const three = fiveSegmentDigits.find(d => digitContainsSegments(d, one));

            // 9 is the only 6-segment digit that includes all segments in 4. (1, 3, 4, 7, 8, 9)
            const nine = sixSegmentDigits.find(d => digitContainsSegments(d, four));

            // 5 is the only remaining unknown 5-segment digit that is a subset of 9. (1, 3, 4, 5, 7, 8, 9)
            const five = fiveSegmentDigits.find(d => digitContainsSegments(nine, d) && d !== three);

            // 2 is the only remaining unidentified 5-segment digit (1, 2, 3, 4, 5, 7, 8, 9)
            const two = fiveSegmentDigits.find(d => d !== five && d !== three);

            // 0 is the only remaining unidentified 6-segment digit that contains 1 (0, 1, 2, 3, 4, 5, 7, 8, 9)
            const zero = sixSegmentDigits.find(d => digitContainsSegments(d, one) && d !== nine);

            // 6 is the only remaining unidentified 6-segment digit (done)
            const six = sixSegmentDigits.find(d => d !== zero && d !== nine);

            return [zero, one, two, three, four, five, six, seven, eight, nine];
        }

        const disambiguatedDigits = disambiguateDigits(entry.uniqueDigits);
        const value = parseInt(entry.outputValue.map(digitString => mapDigitToBase10(digitString, disambiguatedDigits).toString()).join(""))
        return value;
    }

    return entries.map(calculateOutputValue).reduce((a, b) => a + b);
}

const entries = loadInput('day_8.input').split("\n").map(parseEntry);

console.log("Part 1", part1(entries));
console.log("Part 2", part2(entries));