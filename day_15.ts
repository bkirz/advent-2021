import { loadInput, minBy } from "./helpers";

type Grid = number[][];

interface Point { row: number, col: number };

const START = {row: 0, col: 0};

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

// We can envision the cave as a directed graph where every cell is a node with edges
// leaving towards and entering from its neighbors. Edges are weighted using the destination node.
// From there, we just use dijkstra's.

const input = loadInput('day_15.input');
const grid = input.split("\n").map(line => line.split('').map(cell => parseInt(cell)));

const destination = {row: grid.length - 1, col: grid[grid.length - 1].length - 1};

const distances = grid.map(row => new Array(row.length).fill(Infinity));
const visited = grid.map(row => new Array(row.length).fill(false));

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

    for (const neighbor of neighbors(currentNode, grid)) {
        const newDistance = distances[currentNode.row][currentNode.col] + grid[neighbor.row][neighbor.col];
        if (newDistance < distances[neighbor.row][neighbor.col]) {
            distances[neighbor.row][neighbor.col] = newDistance;
        }
    }
}

console.log("Part 1", distances[destination.row][destination.col]);