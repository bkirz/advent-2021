import { eachCons, loadInput, maxBy, minBy, tally } from "./helpers";

type Element = string;

type PolymerTemplate = Element[];

// key: character pair as a length-2 string because that's the only way JS knows how to hash keys correctly :) :) :) :)
// value: number of occurrences in the template
type TemplateMap = Map<string, number>;
interface PairInsertionRule {
    firstElem: Element,
    secondElem: Element,
    elemToInsert: Element
}

function ruleToKVPair(rule: PairInsertionRule): [string, string] {
    return [rule.firstElem + rule.secondElem, rule.elemToInsert];
}

function addToTemplateMap(m: TemplateMap, pair: string, count: number): TemplateMap {
    let oldCount = m.has(pair) ? m.get(pair) : 0;
    return new Map([...m, [pair, count + oldCount]]);
}

function templateToMap(template: PolymerTemplate): TemplateMap {
    let templateMap = new Map();
    eachCons(template, 2).forEach(([first, second]) => templateMap = addToTemplateMap(templateMap, first + second, 1));
    return templateMap;
}

function templateMapToElementCounts(templateMap: TemplateMap, lastElement: Element): Map<string, number> {
    // Init the last element to 1 since it's the one value that isn't captured as the first element of a pair.
    let counts = new Map([[lastElement, 1]]);

    for (let [pair, count] of templateMap) {
        const firstElem = pair.charAt(0);
        const elemCount = counts.has(firstElem) ? counts.get(firstElem) + count : count;
        counts.set(firstElem, elemCount);
    }

    return counts;
}

function applyInsertions(templateMap: TemplateMap, rules: PairInsertionRule[]): TemplateMap {
    const rulesMap: Map<string, string> = new Map(rules.map(ruleToKVPair));

    let newTemplateMap: TemplateMap = new Map();
    for (let [pair, count] of templateMap) {
        if (rulesMap.has(pair)) {
            const firstPair = pair.charAt(0) + rulesMap.get(pair);
            const secondPair = rulesMap.get(pair) + pair.charAt(1);

            newTemplateMap = addToTemplateMap(newTemplateMap, firstPair, count);
            newTemplateMap = addToTemplateMap(newTemplateMap, secondPair, count);
        } else {
            newTemplateMap = addToTemplateMap(newTemplateMap, pair, count);
        }
    }

    return newTemplateMap;
}

function calculateMinMaxDifferenceAfterIterations(initialTemplate: PolymerTemplate, rules: PairInsertionRule[], numIterations: number): number {
    // Convert the template from a naive array-based impl to a map of pairs to counts.
    let templateMap = templateToMap(initialTemplate);
    for (let iteration = 0; iteration < numIterations; iteration++) {
        templateMap = applyInsertions(templateMap, rules);
    }

    // Convert the map form of a template to a map of individual element -> count
    const countsByElement: Map<Element, number> = templateMapToElementCounts(templateMap, initialTemplate[initialTemplate.length - 1]);

    // Calc difference between most common and least common
    const [_mostCommonElement, mostCommonElementCount] = maxBy([...countsByElement.entries()], entry => entry[1]);
    const [_leastCommonElement, leastCommonElementCount] = minBy([...countsByElement.entries()], entry => entry[1]);
    return mostCommonElementCount - leastCommonElementCount;
}

const RULE_PATTERN = /([A-Z])([A-Z]) -> ([A-Z])/;

const input = loadInput('day_14.input');
const [templateStr, _, ...ruleStrs] = input.split("\n");
const initialTemplate: PolymerTemplate = templateStr.split('');
const rules: PairInsertionRule[] = ruleStrs.map(str => {
    const [_, first, second, toInsert] = RULE_PATTERN.exec(str);
    return {firstElem: first, secondElem: second, elemToInsert: toInsert};
});

console.log("Part 1", calculateMinMaxDifferenceAfterIterations(initialTemplate, rules, 10));
console.log("Part 2", calculateMinMaxDifferenceAfterIterations(initialTemplate, rules, 40));
