import { loadInput, tally } from './helpers';

interface Coord { x: number; y: number; }
interface Line { start: Coord; end: Coord; }

const INPUT_PATTERN = /(\d+),(\d+) -> (\d+),(\d+)/;
function parseLine(line: string): Line {
    const [_, x1, y1, x2, y2] = [...line.match(INPUT_PATTERN)];
    return { 
        start: {x: parseInt(x1), y: parseInt(y1)},
        end: {x: parseInt(x2), y: parseInt(y2)}
    };
}

// This only works because of the part 1 assumption that two points
// on a line either share an x or y coordinate. The algorithm is very
// wrong if they're not!!!
function coordsFromLine(line: Line): Coord[] {
    const coords: Coord[] = [];
    let [minx, maxx] = [Math.min(line.start.x, line.end.x), Math.max(line.start.x, line.end.x)];
    let [miny, maxy] = [Math.min(line.start.y, line.end.y), Math.max(line.start.y, line.end.y)];
    for (let x = minx; x <= maxx; x++) {
        for (let y = miny; y <= maxy; y++) {
            coords.push({x, y});
        }
    }
    return coords;
}

// Need this because JS doesn't let you use objects as Map keys. outstanding.
function stringifyCoord({x, y}: Coord): string {
    return `${x},${y}`;
}

function horizontalOrVertical({start: {x: sx, y: sy}, end: {x: ex, y: ey}}: Line): boolean {
    return sx == ex || sy == ey;
}

const lines = loadInput('day_5.input').split("\n").map(parseLine);

const coords = lines.filter(horizontalOrVertical).map(coordsFromLine).reduce((a, b) => a.concat(b), []);
const counts = tally(coords.map(stringifyCoord));
const result = [...counts.values()].filter((count) => count > 1).length;
console.log("Part 1", result);