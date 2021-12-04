import { utimes } from 'fs';
import { eachSlice, every, find, range, loadInput, exists, partition } from './helpers';

const BOARD_SIZE = 5;

type board = number[][];

interface coord { row: number; col: number; }

interface boardState {
    board: board;
    markedCoords: coord[];
}

interface winningBoard { boardState: boardState; lastCalledNumber: number; }

const parseInput = (input: string): [numberCalls: number[], boardStates: boardState[]] => {
    const [numberCallsLine, ...boardsLines] = input.split("\n").filter(line => line !== "");
    const numberCalls = numberCallsLine.split(",").map(n => parseInt(n, 10));

    const boards = eachSlice(boardsLines, BOARD_SIZE).map((boardLines) => { 
        return boardLines.map(line => line.split(/\s+/).filter(line => line !== "").map(n => parseInt(n, 10)));
    });

    return [numberCalls, boards.map(board => { return {board: board, markedCoords: []}; })];
}

const applyCall = (boardState: boardState, call: number): boardState => {
    for (let col = 0; col < BOARD_SIZE; col++) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            const value = boardState.board[row][col];
            if (value === call) {
                return {...boardState, markedCoords: [...boardState.markedCoords, {row, col}]};
            };
        }
    }
    return boardState;
}

const coordsEqual = (a: coord, b: coord) => a.row === b.row && a.col === b.col

const isMarked = (boardState: boardState, coord: coord) => {
    return exists(boardState.markedCoords, (c) => coordsEqual(coord, c));
}

const isWinner = (boardState: boardState): boolean => {
    for (let index = 0; index < BOARD_SIZE; index++) {
        const rowCoords = range(0, BOARD_SIZE - 1).map(n => { return {row: index, col: n}; });
        const colCoords = range(0, BOARD_SIZE - 1).map(n => { return {row: n, col: index}; });

        const rowIsFullyMarked = every(rowCoords, (coord) => isMarked(boardState, coord));
        const colIsFullyMarked = every(colCoords, (coord) => isMarked(boardState, coord));

        if (rowIsFullyMarked || colIsFullyMarked) { return true; }
    }
    return false;
}

const calculateScore = (boardState: boardState, justCalled: number): number => {
    let total = 0;
    for(let row = 0; row < BOARD_SIZE; row++) {
        for(let col = 0; col < BOARD_SIZE; col++) {
            if (!isMarked(boardState, {row: row, col: col})) { 
                total += boardState.board[row][col];
            }
        }
    }
    return total * justCalled;
};

const input = loadInput('day_4.input');
let [numberCalls, boardStates] = parseInput(input);

let winners: winningBoard[] = [];
for (const num of numberCalls) {
    console.log("calling number", num);
    boardStates = boardStates.map(state => applyCall(state, num));
    const [winnersThisRound, stillPlaying] = partition(boardStates, isWinner);
    for (const winner of winnersThisRound) {
        if (winners.length === 0) {
            console.log("Part 1 winning board", winner);
            console.log("Part 1", calculateScore(winner, num));
        }
        winners.push({boardState: winner, lastCalledNumber: num});
    }
    boardStates = stillPlaying;
}

const finalWinner = winners[winners.length - 1];
console.log("Last winning board", finalWinner.boardState);
console.log("Part 2", calculateScore(finalWinner.boardState, finalWinner.lastCalledNumber));
