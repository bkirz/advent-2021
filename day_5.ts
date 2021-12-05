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
function coordsFromLine({start, end}: Line): Coord[] {
    const coords: Coord[] = [];

    let [miny, maxy] = [Math.min(start.y, end.y), Math.max(start.y, end.y)];
    let [minx, maxx] = [Math.min(start.x, end.x), Math.max(start.x, end.x)];
    if (start.x === end.x) {
        // vertical
        for (let y = miny; y <= maxy; y++) {
            coords.push({x: start.x, y});
        }
    } else if (start.y === end.y) {
        // horizontal
        for (let x = minx; x <= maxx; x++) {
            coords.push({x, y: start.y});
        }
    } else if (start.y - end.y + start.x - end.x == 0) {
        // up and to the left
        const rightAngleDistance = maxx - minx;
        for (let n = 0; n <= rightAngleDistance; n++) {
            coords.push({x: minx + n, y: maxy - n});
        }
    } else {
        // down and to the left
        const rightAngleDistance = maxx - minx;
        for (let n = 0; n <= rightAngleDistance; n++) {
            coords.push({x: minx + n, y: miny + n});
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

function countOverlapCoords(lines: Line[]): number {
    const coords = lines.map(coordsFromLine).reduce((a, b) => a.concat(b), []);
    const counts = tally(coords.map(stringifyCoord));
    return [...counts.values()].filter((count) => count > 1).length;
}

const lines = loadInput('day_5.input').split("\n").map(parseLine);

console.log("Part 1", countOverlapCoords(lines.filter(horizontalOrVertical)));
console.log("Part 2", countOverlapCoords(lines));