import { strict as assert } from 'assert';
import fs from 'fs';

enum Direction {
    DOWN = "down",
    FORWARD = "forward",
    UP = "up",
}

interface Movement {
    direction: Direction,
    magnitude: number,
}

interface Position {
    horizontal: number,
    depth: number,
}

const parseLine = (line: string): Movement => {
    const components = line.split(" ");
    assert.equal(components.length, 2);
    return {
        direction: Direction[components[0].toUpperCase()],
        magnitude: parseInt(components[1]),
    };
}

const input = fs.readFileSync('/Users/bkirz/dev/advent_2021/day_2.input');
const movements: Movement[] = input.toString().split("\n").map(parseLine);

const applyMovement = (pos: Position, movement: Movement): Position => {
    console.log("Applying movement ", movement, " to ", pos);
    if (movement.direction === Direction.DOWN) {
        return {...pos, depth: pos.depth + movement.magnitude};
    } else if (movement.direction === Direction.UP) {
        return {...pos, depth: pos.depth - movement.magnitude};
    } else if (movement.direction === Direction.FORWARD) {
        return {...pos, horizontal: pos.horizontal + movement.magnitude};
    }
}

const startingPosition: Position = {horizontal: 0, depth: 0};
const finalPosition = movements.reduce(applyMovement, startingPosition);
const part1Result = finalPosition.horizontal * finalPosition.depth;
console.log("Part 1: ", part1Result);