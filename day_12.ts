import { loadInput } from "./helpers";

const START_NODE = 'start';
const END_NODE = 'end';

type Node = string;
type Graph = Map<Node, Set<Node>>;
type Path = Node[];

function isSmallCave(nodeName: string) {
    return nodeName.toLowerCase() === nodeName;
}

function parseGraph(input: string): Graph {
    let graph = new Map<Node, Set<Node>>();
    input.split("\n").forEach(line => {
        const [nodeA, nodeB] = line.split("-");
        if (!graph.has(nodeA)) { graph.set(nodeA, new Set())};
        graph.get(nodeA).add(nodeB);
        if (!graph.has(nodeB)) { graph.set(nodeB, new Set())};
        graph.get(nodeB).add(nodeA);
    })
    return graph;
}

function step(
    graph: Graph,
    startNode: Node,
    endNode: Node,
    currentPath: Path,
    canBeRevisited: (node: Node, pathSoFar: Path) => boolean
): Path[] {
    const currentNode = currentPath[currentPath.length - 1]; 
    if (currentNode === endNode) { return [currentPath]; }

    const adjacencies = graph.get(currentNode);

    return [...adjacencies].flatMap(nextNode => {
        if (currentPath.includes(nextNode) && !canBeRevisited(nextNode, currentPath)) {
            return [];
        } else {
            return step(graph, startNode, endNode, currentPath.concat(nextNode), canBeRevisited);
        };
    });
}

function part1Paths(graph: Graph, startNode: Node, endNode: Node): Path[] {
    return step(graph, startNode, endNode, [startNode], (nodeName, _) => !isSmallCave(nodeName));
}

function part2Paths(graph: Graph, startNode: Node, endNode: Node): Path[] {
    const canBeRevisited = (nodeName: Node, path: Path) => {
        // start and end caves can never be revisited.
        if (nodeName === START_NODE || nodeName === END_NODE) { return false; }
        // large caves can always be revisited.
        if (!isSmallCave(nodeName)) { return true; }
        // small caves can only be revisited if a small cave has yet to be revisited this path.
        return !path.filter(isSmallCave).some(cave => path.filter(c => c === cave).length > 1);
    };
    return step(graph, startNode, endNode, [startNode], canBeRevisited);
}

const input = loadInput("day_12.input");
console.log("Part 1", part1Paths(parseGraph(input), START_NODE, END_NODE).length);
console.log("Part 2", part2Paths(parseGraph(input), START_NODE, END_NODE).length);