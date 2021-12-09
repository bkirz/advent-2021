import { loadInput } from "./helpers";

interface Point { row: number; col: number; }
type Grid = number[][];

function neighbors({row, col}: Point, grid: Grid) {
    const rowLength = grid[0].length;
    const colLength = grid.length;

    return [
        {row: row + 1, col},
        {row: row - 1, col},
        {row, col: col + 1},
        {row, col: col - 1},
    ].filter(({row, col}) => row >= 0 && row < colLength && col >= 0 && col < rowLength);
}

function isLocalMinimum(point: Point, grid: Grid) {
    const {row, col} = point;
    const heightAtPoint: number = grid[row][col];
    const neighborHeights: number[] = neighbors(point, grid).map(({row, col}) => grid[row][col]);
    return neighborHeights.every(n => n > heightAtPoint);
}

const grid: Grid = loadInput('day_9.input').split("\n").map(line => line.split("").map(n => parseInt(n)));

let localMinima = [];
for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
        const point = {row, col};
        if (isLocalMinimum(point, grid)) { localMinima.push(point); }
    }
}

console.log("Part 1", localMinima.map(({row, col}) => grid[row][col] + 1).reduce((a, b) => a + b));