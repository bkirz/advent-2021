import { loadInput, minBy } from "./helpers";

type Grid = number[][];

interface Point { row: number, col: number };

const START = {row: 0, col: 0};

function unvisitedNeighbors({row, col}: Point, grid: Grid, visited: boolean[][]) {
    const rowLength = grid[0].length;
    const colLength = grid.length;

    return [
        {row: row + 1, col},
        {row: row - 1, col},
        {row, col: col + 1},
        {row, col: col - 1},
    ].filter(({row, col}) => row >= 0 && row < colLength && col >= 0 && col < rowLength && !visited[row][col]);
}

function findLowestTotalRisk(grid: Grid): number {
    // We can envision the cave as a directed graph where every cell is a node with edges
    // leaving towards and entering from its neighbors. Edges are weighted using the destination node.
    // From there, we just use dijkstra's.

    const destination = {row: grid.length - 1, col: grid[grid.length - 1].length - 1};

    const distances = grid.map(row => new Array(row.length).fill(Infinity));
    const visited: boolean[][] = grid.map(row => new Array(row.length).fill(false));

    const queue: Point[] = [];

    distances[START.row][START.col] = 0;

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            queue.push({row, col});
        }
    }

    while (queue.length > 0) {
        const currentNode = minBy(queue, ({row, col}) => distances[row][col]);
        queue.splice(queue.indexOf(currentNode), 1);

        for (const neighbor of unvisitedNeighbors(currentNode, grid, visited)) {
            const newDistance = distances[currentNode.row][currentNode.col] + grid[neighbor.row][neighbor.col];
            if (newDistance < distances[neighbor.row][neighbor.col]) {
                distances[neighbor.row][neighbor.col] = newDistance;
            }
        }
        visited[currentNode.row][currentNode.col] = true;
    }

    return distances[destination.row][destination.col];
}

function tessellateGrid(grid: Grid, repetitions: number): Grid {
    const newGrid = [];

    // The row of the cell in the original grid to be transformed and applied
    for (let originalRow = 0; originalRow < grid.length; originalRow++) {
        // The col of the cell in the original grid to be transformed and applied
        for (let originalCol = 0; originalCol < grid[originalRow].length; originalCol++) {
            const originalValue = grid[originalRow][originalCol];

            // The row corresponding to the repetition of the original grid on the new one
            for (let metaRow = 0; metaRow < repetitions; metaRow++) {
                // The col corresponding to the repetition of the original grid on the new one
                for (let metaCol = 0; metaCol < repetitions; metaCol++) {
                    const newValue = ((originalValue - 1 + metaRow + metaCol) % 9) + 1;
                    const targetRow = originalRow + metaRow * grid.length;
                    const targetCol = originalCol + metaCol * grid[originalRow].length;

                    if (newGrid[targetRow] === undefined) { newGrid[targetRow] = []};

                    newGrid[targetRow][targetCol] = newValue;
                }
            }
        }
    }

    return newGrid;
}

const input = loadInput('day_15.input');
const grid = input.split("\n").map(line => line.split('').map(cell => parseInt(cell)));

console.log("Part 1", findLowestTotalRisk(grid));
console.log("Part 2", findLowestTotalRisk(tessellateGrid(grid, 5)));