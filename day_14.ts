import { loadInput, maxBy, minBy, tally } from "./helpers";

type Element = string;
type PolymerTemplate = Element[];

interface PairInsertionRule {
    firstElem: Element,
    secondElem: Element,
    elemToInsert: Element
}

function ruleToKVPair(rule: PairInsertionRule): [string, string] {
    return [rule.firstElem + rule.secondElem, rule.elemToInsert];
}

function applyInsertions(template: PolymerTemplate, rules: PairInsertionRule[]): PolymerTemplate {
    const rulesMap: Map<string, string> = new Map(rules.map(ruleToKVPair));

    let updatedTemplate = [];
    for (let index = 0; index < template.length - 1; index++) {
        updatedTemplate.push(template[index]);
        const ruleKey = template[index] + template[index+1];
        if (rulesMap.has(ruleKey)) {
            const toInsert = rulesMap.get(ruleKey);
            updatedTemplate.push(toInsert);
        }
    }
    updatedTemplate.push(template[template.length - 1]);

    return updatedTemplate;
}

const RULE_PATTERN = /([A-Z])([A-Z]) -> ([A-Z])/;

const input = loadInput('day_14.input');
const [templateStr, _, ...ruleStrs] = input.split("\n");
const initialTemplate: PolymerTemplate = templateStr.split('');
const rules: PairInsertionRule[] = ruleStrs.map(str => {
    const [_, first, second, toInsert] = RULE_PATTERN.exec(str);
    return {firstElem: first, secondElem: second, elemToInsert: toInsert};
});

let template = initialTemplate;
for (let iteration = 0; iteration < 10; iteration++) {
    template = applyInsertions(template, rules);
}

const countsByElement: Map<Element, number> = tally(template);
const [mostCommonElement, mostCommonElementCount] = maxBy([...countsByElement.entries()], entry => entry[1]);
const [leastCommonElement, leastCommonElementCount] = minBy([...countsByElement.entries()], entry => entry[1]);
console.log("Part 1", mostCommonElementCount - leastCommonElementCount);