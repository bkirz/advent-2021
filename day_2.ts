import { strict as assert } from 'assert';
import { loadInput } from './helpers';

enum Direction { DOWN, FORWARD, UP }

interface Movement {
    direction: Direction,
    magnitude: number,
}

interface Part1Position {
    horizontal: number,
    depth: number,
}

interface Part2Position {
    horizontal: number,
    depth: number,
    aim: number,
}

type Positions = [Part1Position, Part2Position];

const parseLine = (line: string): Movement => {
    const components = line.split(" ");
    assert.equal(components.length, 2);
    return {
        direction: Direction[components[0].toUpperCase()],
        magnitude: parseInt(components[1]),
    };
}

const input = loadInput('day_2.input');
const movements: Movement[] = input.toString().split("\n").map(parseLine);

const applyMovement = ([p1pos, p2pos]: Positions, movement: Movement): Positions => {
    if (movement.direction === Direction.DOWN) {
        return [
            {...p1pos, depth: p1pos.depth + movement.magnitude},
            {...p2pos, aim: p2pos.aim + movement.magnitude},
        ];
    } else if (movement.direction === Direction.UP) {
        return [
            {...p1pos, depth: p1pos.depth - movement.magnitude},
            {...p2pos, aim: p2pos.aim - movement.magnitude},
        ];
    } else if (movement.direction === Direction.FORWARD) {
        return [
            {...p1pos, horizontal: p1pos.horizontal + movement.magnitude},
            {...p2pos, horizontal: p2pos.horizontal + movement.magnitude, depth: p2pos.depth + p2pos.aim * movement.magnitude},
        ];
    }
}

const startingPositions: Positions = [{horizontal: 0, depth: 0}, {horizontal: 0, depth: 0, aim: 0}];
const [part1FinalPosition, part2FinalPosition] = movements.reduce(applyMovement, startingPositions);
const part1Result = part1FinalPosition.horizontal * part1FinalPosition.depth;
const part2Result = part2FinalPosition.horizontal * part2FinalPosition.depth;
console.log("Part 1:", part1Result);
console.log("Part 2:", part2Result);