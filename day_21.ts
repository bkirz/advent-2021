import { loadInput } from "./helpers";

type Position = number;
type PlayerState = { trackPosition: Position, pointTotal: number };
type Player = 'p1' | 'p2';
type GameState = {
    p1: PlayerState,
    p2: PlayerState,
    nextPlayer: Player,
    totalDieRolls: number,
    lastNumberRolled: number,
};

const TRACK_LENGTH = 10;
const DIE_SIZE = 100;
const POINT_THRESHOLD = 1000;
const INPUT_PATTERN = /Player \d starting position: (\d)/;

function stepGameState(state: GameState): GameState {
    const [activePlayer, newNextPlayer]: [Player, Player] =
        state.nextPlayer === 'p1' ? ['p1', 'p2'] : ['p2', 'p1'];

    const nextDieRolls = [1, 2, 3].map(n => ((state.lastNumberRolled + n - 1) % DIE_SIZE) + 1);
    const stepsToTake = nextDieRolls.reduce((a, b) => a + b);
    const newPosition = (state[activePlayer].trackPosition - 1 + stepsToTake) % TRACK_LENGTH + 1;
    const newPointTotal = state[activePlayer].pointTotal + newPosition;

    return {
        ...state,
        [activePlayer]: {trackPosition: newPosition, pointTotal: newPointTotal},
        nextPlayer: newNextPlayer,
        totalDieRolls: state.totalDieRolls + nextDieRolls.length,
        lastNumberRolled: nextDieRolls[nextDieRolls.length - 1],
    }
}

function advanceStateUntilVictory(state: GameState): GameState {
    let gameState = initialGameState;

    while (gameState.p1.pointTotal < POINT_THRESHOLD && gameState.p2.pointTotal < POINT_THRESHOLD) {
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
    lastNumberRolled: DIE_SIZE,
    nextPlayer: 'p1',
};

// The winner must have been the one who just played, so the next player is the loser.
const finalState = advanceStateUntilVictory(initialGameState);
const losingPlayer = finalState.nextPlayer;

console.log("Part 1", finalState[losingPlayer].pointTotal * finalState.totalDieRolls);