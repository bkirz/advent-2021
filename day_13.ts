import { loadInput } from "./helpers";

interface Dot { x: number; y: number; };
interface Fold { axis: string, location: number };

// We don't need to model the entire grid since it's effectively
// a sparse collection of dots.
type Grid = Dot[];

function parseDot(str: string): Dot {
    const [x, y] = str.split(',').map(n => parseInt(n));
    return {x, y};
}

function serializeDot({x, y}: Dot): string {
    return `${x},${y}`;
}

function foldGrid(grid: Grid, fold: Fold): Grid {
    function foldDot(dot: Dot, {axis, location}: Fold): Dot {
        if (dot[axis] >= location) {
            const distance = dot[axis] - location;
            return {...dot, [axis]: dot[axis] - 2 * distance};
        } else {
            return dot;
        }
    }

    function removeDupes(grid: Grid): Grid {
        // JavaScript is Special and doesn't provide a uniq/uniqBy method,
        // so let's build one ourselves!!!! :) :) :)
        return [...new Set(grid.map(serializeDot))].map(parseDot);
    }

    return removeDupes(grid.map(dot => foldDot(dot, fold)));
}

function renderGrid(grid: Grid): string {
    const maxX = Math.max(...grid.map(dot => dot.x));
    const maxY = Math.max(...grid.map(dot => dot.y));

    const serializedDots: Set<string> = new Set(grid.map(serializeDot));

    let gridString = "";

    for (let y = 0; y <= maxY; y++) {
        for (let x = 0; x <= maxX; x++) {
            if (serializedDots.has(serializeDot({x, y}))) {
                gridString = gridString + "#";
            } else {
                gridString = gridString + ".";
            }
        }
        gridString = gridString + "\n";
    }

    return gridString;
}

const DOT_PATTERN = /\d+,\d+/;
const FOLD_PATTERN = /fold along (x|y)=(\d+)/;

const input = loadInput("day_13.input");
const lines = input.split("\n");
const grid: Grid = lines.filter(l => l.match(DOT_PATTERN)).map(parseDot);
const folds: Fold[] = lines.filter(l => l.match(FOLD_PATTERN)).map(l => {
    const [_, axis, location] = l.match(FOLD_PATTERN);
    return { axis: axis, location: parseInt(location) };
});

console.log("Part 1", foldGrid(grid, folds[0]).length);
console.log("Part 2");
console.log(renderGrid(folds.reduce((grid: Grid, fold: Fold) => foldGrid(grid, fold), grid)));