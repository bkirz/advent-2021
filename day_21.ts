import assert from "assert";
import { ImmutableHashMap, ImmutableHashSet, loadInput, tallyBy } from "./helpers";

const TRACK_LENGTH = 10;
const DIE_ROLLS_PER_TURN = 3;
const INPUT_PATTERN = /Player \d starting position: (\d)/;

type Position = number;
interface PlayerState { readonly trackPosition: Position; readonly pointTotal: number; }
type Player = 'p1' | 'p2';
const PLAYERS: Player[] = ['p1', 'p2'];
interface DieRoll { readonly die: Die; readonly result: number; };
interface Die { readonly lastNumberRolled: number; readonly roll: () => DieRoll[]; }
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

    roll(): DieRoll[] {
        const result = (this.lastNumberRolled % DeterministicDie.SIZE) + 1;
        return [{ die: new DeterministicDie(result), result }];
    }
}

class DiracDie implements Die {
    // not supported
    lastNumberRolled: number = 0;

    roll(): DieRoll[] {
        return [1, 2, 3].map(result => ({ die: this, result }));
    }
}

function stepGameState(state: GameState): GameState[] {
    const [activePlayer, newNextPlayer]: [Player, Player] =
        state.nextPlayer === 'p1' ? ['p1', 'p2'] : ['p2', 'p1'];

    let nextDieRolls: DieRoll[][] = [[]];
    for (let rollNum = 0; rollNum < DIE_ROLLS_PER_TURN; rollNum++) {
        const newRollHistories = [];
        for (const rollHistory of nextDieRolls) {
            const previousRollResult = rollHistory[rollHistory.length - 1];
            const die = previousRollResult === undefined ? state.die : previousRollResult.die;
            const newRolls = die.roll();

            for (const newRoll of newRolls) {
                newRollHistories.push(rollHistory.concat(newRoll));
            }
        }
        nextDieRolls = newRollHistories;
    }

    return nextDieRolls.map((rollHistory: DieRoll[]) => {
        const stepsToTake = rollHistory.map(roll => roll.result).reduce((a, b) => a + b, 0);
        const newPosition = (state[activePlayer].trackPosition - 1 + stepsToTake) % TRACK_LENGTH + 1;
        const newPointTotal = state[activePlayer].pointTotal + newPosition;

        const lastRoll = rollHistory[rollHistory.length - 1];

        return {
            ...state,
            [activePlayer]: {trackPosition: newPosition, pointTotal: newPointTotal},
            nextPlayer: newNextPlayer,
            totalDieRolls: state.totalDieRolls + rollHistory.length,
            die: lastRoll.die,
        };
    });
}

function advanceStateUntilVictory(state: GameState, pointThreshold: number): GameState {
    let gameState = state;

    while (gameState.p1.pointTotal < pointThreshold && gameState.p2.pointTotal < pointThreshold) {
        const newGameStates = stepGameState(gameState);
        assert.equal(newGameStates.length, 1);
        gameState = newGameStates[0];
    }

    return gameState;
}

function countVictoriesByPlayer(initialState: GameState, pointThreshold: number): {p1: number, p2: number} {
    function isTerminalState(state: GameState): boolean {
        return PLAYERS.some(p => state[p].pointTotal >= pointThreshold);
    }

    function hashState(state: GameState): string {
        const {p1, p2} = state;
        return `[(${state.nextPlayer})p1:${p1.pointTotal}@${p1.trackPosition},p2:${p2.pointTotal}@${p2.trackPosition}]`;
    }

    function mergeCountMaps<K>(a: ImmutableHashMap<K, number>, b: ImmutableHashMap<K, number>): ImmutableHashMap<K, number> {
        return a.merge(b, (_key, aCount, bCount) => aCount + bCount);
    }

    // Memoize using a map of unfinished game states to number of outcomes.
    //
    // Track completed states separately as a map of winner to count to avoid tracking individual end states.
    // State to use when hashing for memoization:
    //   - Player positions and point totals
    //   - next player
    // Because there are:
    //   - ten spaces per player
    //   - two possible active players
    //   - 21 possible point values for each player
    // This leaves 88.2K possible game states, which is a sufficiently small number for memoization.

    let outcomes = new ImmutableHashMap<GameState, number>(hashState, [[initialState, 1]]);
    let wins = {p1: 0, p2: 0};

    while (outcomes.size() > 0) {
        console.log("stepped game states so far", [...outcomes.entries()].map(([state, count]) => [hashState(state), count]));
        console.log("wins so far", wins);

        const newOutcomesMaps = [...outcomes.entries()].map(([state, count]) => {
            const newStates: GameState[] = stepGameState(state);
            const counts: ImmutableHashMap<GameState, number> =
                tallyBy(newStates, hashState).mapValues(c => c * count);
            return counts;
        })

        // This is slow as hell. It works, but would be much faster by merging them all at once.
        const newOutcomes = newOutcomesMaps.reduce(mergeCountMaps);

        const [terminalStates, inProgressStates] =
            newOutcomes.partition((state, _count) => isTerminalState(state));

        outcomes = inProgressStates;

        const [p2Victories, p1Victories] =
            terminalStates.partition((state, _count) => state.nextPlayer == "p1");

        wins.p1 += [...p1Victories.values()].reduce((a, b) => a + b, 0);
        wins.p2 += [...p2Victories.values()].reduce((a, b) => a + b, 0);
    }

    return wins;
}

const input = loadInput('day_21.input');
const [p1Start, p2Start] = input.split("\n").map(line => {
    const [_, position] = INPUT_PATTERN.exec(line);
    return parseInt(position);
});

const part1InitialGameState: GameState = {
    p1: { trackPosition: p1Start, pointTotal: 0 },
    p2: { trackPosition: p2Start, pointTotal: 0 },
    totalDieRolls: 0,
    nextPlayer: 'p1',
    die: new DeterministicDie(),
};

// The winner must have been the one who just played, so the next player is the loser.
const finalState = advanceStateUntilVictory(part1InitialGameState, 1000);
const losingPlayer = finalState.nextPlayer;

console.log("Part 1", finalState[losingPlayer].pointTotal * finalState.totalDieRolls);

const part2InitialGameState: GameState = { ...part1InitialGameState, die: new DiracDie() };
const victoriesByPlayer = countVictoriesByPlayer(part2InitialGameState, 21);
console.log("Part 2", Math.max(victoriesByPlayer.p1, victoriesByPlayer.p2));