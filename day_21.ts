import { loadInput, range } from "./helpers";

const TRACK_LENGTH = 10;
const DIE_ROLLS_PER_TURN = 3;
const INPUT_PATTERN = /Player \d starting position: (\d)/;

type Position = number;
interface PlayerState { readonly trackPosition: Position; readonly pointTotal: number; }
type Player = 'p1' | 'p2';
interface DieRoll { readonly die: Die; readonly result: number; };
interface Die { readonly lastNumberRolled: number; readonly roll: () => DieRoll; }
interface GameState {
    readonly p1: PlayerState;
    readonly p2: PlayerState;
    readonly nextPlayer: Player;
    readonly totalDieRolls: number;
    readonly die: Die;
};

class DeterministicDie implements Die {
    static SIZE: number = 100;
    lastNumberRolled: number;

    constructor(lastNumberRolled: number = DeterministicDie.SIZE) {
        this.lastNumberRolled = lastNumberRolled;
    }

    roll(): DieRoll {
        const result = (this.lastNumberRolled % DeterministicDie.SIZE) + 1;
        return { die: new DeterministicDie(result), result };
    }
}

function stepGameState(state: GameState): GameState {
    const [activePlayer, newNextPlayer]: [Player, Player] =
        state.nextPlayer === 'p1' ? ['p1', 'p2'] : ['p2', 'p1'];

    const nextDieRolls: DieRoll[] = [];
    let die = state.die;
    for (let rollNum = 0; rollNum < DIE_ROLLS_PER_TURN; rollNum++) {
        const roll = die.roll();
        die = roll.die;
        nextDieRolls.push(roll);
    }
    const stepsToTake = nextDieRolls.map(roll => roll.result).reduce((a, b) => a + b, 0);
    const newPosition = (state[activePlayer].trackPosition - 1 + stepsToTake) % TRACK_LENGTH + 1;
    const newPointTotal = state[activePlayer].pointTotal + newPosition;

    return {
        ...state,
        [activePlayer]: {trackPosition: newPosition, pointTotal: newPointTotal},
        nextPlayer: newNextPlayer,
        totalDieRolls: state.totalDieRolls + nextDieRolls.length,
        die: die,
    }
}

function advanceStateUntilVictory(state: GameState, pointThreshold: number): GameState {
    let gameState = initialGameState;

    while (gameState.p1.pointTotal < pointThreshold && gameState.p2.pointTotal < pointThreshold) {
        gameState = stepGameState(gameState);
    }

    return gameState;
}

const input = loadInput('day_21.input');
const [p1Start, p2Start] = input.split("\n").map(line => {
    const [_, position] = INPUT_PATTERN.exec(line);
    return parseInt(position);
});

const initialGameState: GameState = {
    p1: { trackPosition: p1Start, pointTotal: 0 },
    p2: { trackPosition: p2Start, pointTotal: 0 },
    totalDieRolls: 0,
    nextPlayer: 'p1',
    die: new DeterministicDie(),
};

// The winner must have been the one who just played, so the next player is the loser.
const finalState = advanceStateUntilVictory(initialGameState, 1000);
const losingPlayer = finalState.nextPlayer;

console.log("Part 1", finalState[losingPlayer].pointTotal * finalState.totalDieRolls);