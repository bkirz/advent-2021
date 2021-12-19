import assert from "assert";
import { isDeepStrictEqual } from "util";
import { loadInput } from "./helpers";

type SnailfishNumberPair = { readonly type: "pair", readonly left: SnailfishNumber, readonly right: SnailfishNumber };
type SnailfishNumberLeaf = { readonly type: "leaf", readonly value: number };
type SnailfishNumber = SnailfishNumberLeaf | SnailfishNumberPair;

type Direction = "left" | "right";
type Path = Direction[];

type Replacement = { path: Path, replacementNode: SnailfishNumber };

const EXPLOSION_THRESHOLD = 4;

function parseLine(str: string): SnailfishNumber {
    function arrayToSnailfishNumber(jsonObject: any): SnailfishNumber {
        if (typeof(jsonObject) === "number") {
            return { type: "leaf", value: jsonObject };
        } else if (Array.isArray(jsonObject)) {
            const [left, right] = jsonObject;
            return { type: "pair", left: arrayToSnailfishNumber(left), right: arrayToSnailfishNumber(right) };
        } else {
            throw new Error("Unexpected input: " + JSON.stringify(jsonObject));
        }
    }

    return arrayToSnailfishNumber(JSON.parse(str));
}

function findLeftmostPathToExplode(num: SnailfishNumberPair): Path | null {
    function doRecursively(currentNum: SnailfishNumber, pathSoFar: Path): Path | null {
        switch (currentNum.type) {
            case "pair":
                const [left, right] = [currentNum.left, currentNum.right];

                if (left.type === "leaf" && right.type === "leaf") {
                    // This is the base case for potentially exploding.
                    if (pathSoFar.length + 1 > EXPLOSION_THRESHOLD) {
                        return pathSoFar;
                    } else {
                        return null;
                    }
                } else {
                    if (currentNum.left.type === "pair") {
                        const leftResult = doRecursively(currentNum.left, pathSoFar.concat("left"));
                        if (leftResult !== null) { return leftResult; }
                    }

                    if (currentNum.right.type === "pair") {
                        const rightResult = doRecursively(currentNum.right, pathSoFar.concat("right"));
                        if (rightResult !== null) { return rightResult; }
                    }

                    return null;
                }
        }
    }

    return doRecursively(num, []);
}

function needsExplosion(num: SnailfishNumber, currentDepth: number = 0): boolean {
    function depth(num: SnailfishNumber): number {
        switch (num.type) {
            case "leaf": return 0;
            case "pair": return 1 + Math.max(depth(num.left), depth(num.right));
        }
    }

    return depth(num) + currentDepth > EXPLOSION_THRESHOLD;
}

function needsSplit(num: SnailfishNumber): boolean {
    switch (num.type) {
        case "leaf": return num.value >= 10;
        case "pair": return needsSplit(num.left) || needsSplit(num.right);
    }
}

function applyExplosion(num: SnailfishNumberPair): SnailfishNumberPair {
    const pathToExplodingNode: Path | null = findLeftmostPathToExplode(num);
    if (pathToExplodingNode === null) { throw new Error(`Found no paths to explode in ${num}`) };

    const nodeToExplode: SnailfishNumber = followPath(num, pathToExplodingNode);
    if (nodeToExplode.type === 'leaf') {
        throw new Error("Can't explode a leaf node.");
    }
    if (nodeToExplode.left.type === 'pair' || nodeToExplode.right.type === 'pair') {
        throw new Error("Can't explode number with nested pairs.");
    }
    const [leftValue, rightValue] = [nodeToExplode.left.value, nodeToExplode.right.value];

    const replacements: Replacement[] = [{ path: pathToExplodingNode, replacementNode: { type: "leaf", value: 0 } }];

    const pathToLeftNeighbor: Path | null = findLeftNeighborLeaf(num, pathToExplodingNode);
    const pathToRightNeighbor: Path | null = findRightNeighborLeaf(num, pathToExplodingNode);

    if (pathToLeftNeighbor !== null) {
        const leftNeighborNode = followPath(num, pathToLeftNeighbor);
        assert(leftNeighborNode.type === "leaf");
        const replacementNode: SnailfishNumber = { type: "leaf", value: leftNeighborNode.value + leftValue };
        replacements.push({ path: pathToLeftNeighbor, replacementNode });
    }

    if (pathToRightNeighbor !== null) {
        const rightNeighborNode = followPath(num, pathToRightNeighbor);
        assert(rightNeighborNode.type === "leaf");
        const replacementNode: SnailfishNumber = { type: "leaf", value: rightNeighborNode.value + rightValue };
        replacements.push({ path: pathToRightNeighbor, replacementNode });
    }

    const newNum = copyWithReplacements(num, replacements);
    assert(newNum.type === "pair");
    return newNum;
}

function findLeftNeighborLeaf(num: SnailfishNumber, path: Path): Path {
    // Remove all `left`s from the end of the path, then one `right`.
    let modifiedPath = path.slice();
    while (modifiedPath.at(-1) === "left") { modifiedPath.pop(); }

    if (modifiedPath.length === 0) {
        // The path was to the leftmost node, so there is no left neighbor.
        return null;
    }

    // Remove the remaining right and replace it with a left.
    modifiedPath.pop();
    modifiedPath.push("left")

    // Add `right` until we find a leaf node.
    while (followPath(num, modifiedPath).type === "pair") {
        modifiedPath.push("right");
    }

    return modifiedPath;
}

function findRightNeighborLeaf(num: SnailfishNumber, path: Path): Path | null {
    // Remove all `right`s from the end of the path, then one `left`.
    let modifiedPath = path.slice();
    while (modifiedPath.at(-1) === "right") { modifiedPath.pop(); }

    if (modifiedPath.length === 0) {
        // The path was to the rightmost node, so there is no right neighbor.
        return null;
    }

    // Remove the remaining left and replace it with a right.
    modifiedPath.pop();
    modifiedPath.push("right");

    // Add `left` until we find a leaf node.
    while (followPath(num, modifiedPath).type === "pair") {
        modifiedPath.push("left");
    }

    return modifiedPath;
}

function copyWithReplacements(num: SnailfishNumber, replacements: Replacement[]): SnailfishNumber {
    function doRecursively(num: SnailfishNumber, replacements: Replacement[], pathSoFar: Path) {
        const maybeReplacement: Replacement | undefined =
            replacements.find((replacement) => isDeepStrictEqual(replacement.path, pathSoFar));

        if (maybeReplacement) { return maybeReplacement.replacementNode; }

        if (num.type === "leaf") { return num; }

        return {
            type: "pair",
            left: doRecursively(num.left, replacements, pathSoFar.concat("left")),
            right: doRecursively(num.right, replacements, pathSoFar.concat("right")),
        }
    }

    return doRecursively(num, replacements, []);
}

function followPath(num: SnailfishNumber, path: Path): SnailfishNumber {
    if (path.length === 0) { return num; }

    assert.equal("pair", num.type, "Can't follow path into leaf node.");

    const [head, ...tail] = path;
    return followPath(num[head], tail);
}

function applySplit(num: SnailfishNumber): SnailfishNumber {
    switch (num.type) {
        case "leaf":
            if (num.value >= 10) {
                return {
                    type: "pair",
                    left: { type: "leaf", value: Math.floor(num.value / 2) },
                    right: { type: "leaf", value: Math.ceil(num.value / 2) },
                };
            } else {
                return num;
            }
        case "pair":
            if (needsSplit(num.left)) {
                return { ...num, left: applySplit(num.left) };
            } else if (needsSplit(num.right)) {
                return { ...num, right: applySplit(num.right) };
            } else {
                return num;
            }
    }
}

function addNumbers(a: SnailfishNumber, b: SnailfishNumber): SnailfishNumber {
    return applyReduction({ type: "pair", left: a, right: b });
}

function applyReduction(num: SnailfishNumberPair): SnailfishNumber {
    let newNum = num;
    while (needsExplosion(newNum) || needsSplit(newNum)) {
        if (needsExplosion(newNum)) {
            newNum = applyExplosion(newNum);
        } else if (needsSplit(newNum)) {
            const maybePair = applySplit(newNum);
            if (maybePair.type === 'leaf') { throw new Error("Can't have a top-level leaf"); }
            newNum = maybePair;
        }
    }
    return newNum;
}

function magnitude(num: SnailfishNumber): number {
    switch(num.type) {
        case "leaf": return num.value;
        case "pair": return 3 * magnitude(num.left) + 2 * magnitude(num.right);
    }
}

function format(num: SnailfishNumber): string {
    switch(num.type) {
        case "leaf": return num.value.toString();
        case "pair": return `[${format(num.left)},${format(num.right)}]`;
    }
}

// Specifically find all permutations of length 2
function permutations<T>(arr: T[]): [T, T][] {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            result.push([arr[i], arr[j]]);
            result.push([arr[j], arr[i]]);
        }
    }
    return result;
}

const input = loadInput('day_18.input');
const lines = input.split("\n");
const inputNumbers: SnailfishNumber[] = lines.map(parseLine);

console.log("Part 1", magnitude(inputNumbers.map(applyReduction).reduce(addNumbers)));
console.log("Part 2", Math.max(...permutations(inputNumbers).map(([a, b]) => magnitude(addNumbers(a, b)))));