import { loadInput, range, sum, tally } from './helpers';

type timerCounts = Map<number, number>;
const NEW_FISH_TIME = 8;

function advanceTimers(timers: timerCounts): timerCounts {
    const newTimers: timerCounts = new Map();
    // For all fish with timer N > 0, tick their timers down 1.
    for (let age = 1; age <= NEW_FISH_TIME; age++) {
        newTimers.set(age - 1, timers.get(age) || 0);
    }
    // For fish with timers set to 0, spawn a new fish for each one with timer = 8...
    newTimers.set(8, timers.get(0) || 0);
    // ...and add their timers to the pool of timers to be set to 6.
    newTimers.set(6, (timers.get(7) || 0) + (timers.get(0) || 0));
    return newTimers;
}

function runForDays(initialTimers: timerCounts, days: number): timerCounts {
    return range(1, days).reduce((timers, _day) => advanceTimers(timers), initialTimers);
}

let timers = tally(loadInput('day_6.input').split(',').map((n) => parseInt(n)));
console.log("Part 1", sum([...runForDays(timers, 80).values()]));
console.log("Part 1", sum([...runForDays(timers, 256).values()]));