import { exists, loadInput, range } from "./helpers";

interface Point { row: number; col: number; }

function equals(a: Point, b: Point): boolean {
    return a.row === b.row && a.col === b.col;
}

const FLASH_THRESHOLD = 9;

type Grid = number[][];

function getNeighbors({row, col}: Point, grid: Grid) {
    const rowLength = grid[0].length;
    const colLength = grid.length;

    return [
        {row: row - 1, col: col - 1},
        {row: row - 1, col},
        {row: row - 1, col: col + 1},
        {row, col: col - 1},
        {row, col: col + 1},
        {row: row + 1, col: col - 1},
        {row: row + 1, col},
        {row: row + 1, col: col + 1},
    ].filter(({row, col}) => row >= 0 && row < colLength && col >= 0 && col < rowLength);
}

function stepGrid(grid: Grid): [number, Grid] {
    const newGrid: number[][] = [];
    let numFlashes = 0;

    // Step 1: Increment
    for (let row = 0; row < grid.length; row++) {
        newGrid[row] = [];
        for (let col = 0; col < grid[row].length; col++) {
            newGrid[row][col] = grid[row][col] + 1;
        }
    }

    // Step 2: Resolve flashes until none are left
    let keepIterating = true;
    while (keepIterating) {
        keepIterating = false;
        for (let row = 0; row < newGrid.length; row++) {
            for (let col = 0; col < newGrid[row].length; col++) {
                if (newGrid[row][col] > FLASH_THRESHOLD) {
                    numFlashes++;
                    newGrid[row][col] = 0;
                    const neighbors = getNeighbors({row, col}, newGrid);
                    for (const neighbor of neighbors) {
                        if (newGrid[neighbor.row][neighbor.col] !== 0) {
                            keepIterating = true;
                            newGrid[neighbor.row][neighbor.col]++;
                        }
                    }
                }
            }
        }
    }

    return [numFlashes, newGrid];
}

function part1(startingGrid: Grid): number {
    let grid = startingGrid;
    let numFlashes = 0;
    const NUM_ITERATIONS = 100;
    for (let i = 0; i < NUM_ITERATIONS; i++) {
        let [flashesThisIteration, newGrid] = stepGrid(grid);
        grid = newGrid;
        numFlashes += flashesThisIteration;
    }
    return numFlashes;
}

function part2(startingGrid: Grid): number {
    let grid = startingGrid;
    let iterations = 0;
    do {
        let [flashesThisIteration, newGrid] = stepGrid(grid);
        grid = newGrid;
        iterations++;
    } while (!grid.every(row => row.every(cell => cell === 0)))
    return iterations;
}

const startingGrid = loadInput("day_11.input").split("\n").map(line => line.split('').map(n => parseInt(n)));


console.log("Part 1", part1(startingGrid));
console.log("Part 2", part2(startingGrid));
