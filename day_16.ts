import assert from "assert";
import { loadInput } from "./helpers";

const HEX_DIGIT_TO_BINARY = {
    '0': '0000', '1': '0001', '2': '0010', '3': '0011',
    '4': '0100', '5': '0101', '6': '0110', '7': '0111',
    '8': '1000', '9': '1001', 'A': '1010', 'B': '1011',
    'C': '1100', 'D': '1101', 'E': '1110', 'F': '1111',
};

const LITERAL_VALUE_TYPE_ID = 4;

interface LiteralValuePacket {
    readonly type: 'literal';
    readonly version: number;
    readonly typeId: 4;
    readonly value: number;
};

interface OperatorPacket {
    readonly type: 'operator';
    readonly version: number;
    readonly typeId: Exclude<number, 4>;
    readonly subpackets: Packet[];
}

type Packet = LiteralValuePacket | OperatorPacket;

// All parse functions return a tuple with two components:
// - The parsed value
// - The remainder of the binary string with the parsed part removed

function parseLiteralValue(bin: string): [number, string] {
    let shouldContinue = '1';
    let binaryValue = '';
    let currentIndex = 0;
    while(shouldContinue === '1') {
        let [newShouldContinue, byte] = 
            [bin.charAt(currentIndex), bin.slice(currentIndex + 1, currentIndex + 5)];
        shouldContinue = newShouldContinue;
        binaryValue += byte;
        currentIndex += 5;
    }

    return [parseInt(binaryValue, 2), bin.slice(currentIndex)];
}

function parseOperatorSubpackets(subpacketStr: string): [Packet[], string] {
    const lengthTypeId = subpacketStr.charAt(0);
    if (lengthTypeId === '0') {
        // Total length of subpackets mode
        const totalLengthOfSubpackets = parseInt(subpacketStr.slice(1, 16), 2);
        let rest = subpacketStr.slice(16);
        let subpackets = [];
        while (subpacketStr.length - rest.length - 15 < totalLengthOfSubpackets) {
            let [subpacket, newRest] = parsePacket(rest);
            rest = newRest;
            subpackets.push(subpacket);
        }
        return [subpackets, rest];
    } else if (lengthTypeId === '1') {
        // Number of subpackets mode
        const numberOfSubpackets = parseInt(subpacketStr.slice(1, 12), 2);
        let rest = subpacketStr.slice(12);
        let subpackets = [];
        for (let subpacketIndex = 0; subpacketIndex < numberOfSubpackets; subpacketIndex++) {
            let [subpacket, newRest] = parsePacket(rest);
            rest = newRest;
            subpackets.push(subpacket);
        }
        return [subpackets, rest];
    }
}

function parsePacket(binaryStr: string): [Packet, string] {
    const version = parseInt(binaryStr.slice(0, 3), 2);
    const typeId = parseInt(binaryStr.slice(3, 6), 2);

    if (typeId === 4) {
        const [value, rest] = parseLiteralValue(binaryStr.slice(6));
        return [{type: 'literal', version, typeId, value}, rest];
    } else {
        const [subpackets, rest] = parseOperatorSubpackets(binaryStr.slice(6));
        return [{type: 'operator', version, typeId, subpackets}, rest];
    }
}

function sumVersions(packet: Packet): number {
    function subpackets(packet: Packet): Packet[] {
        if (packet.type === 'literal') {
            return [];
        } else {
            return packet.subpackets;
        }
    }

    return packet.version + subpackets(packet).map(subpacket => sumVersions(subpacket)).reduce((a, b) => a + b, 0);
}

function evalPacket(packet: Packet): number {
    if (packet.type === "literal") { return packet.value; }

    const evaluatedSubpackets = packet.subpackets.map(evalPacket);

    if (packet.typeId > 4) {
        assert.equal(2, evaluatedSubpackets.length);
    }

    if (packet.typeId === 0) {
        return evaluatedSubpackets.reduce((a, b) => a + b, 0);
    } else if (packet.typeId === 1) {
        return evaluatedSubpackets.reduce((a, b) => a * b, 1);
    } else if (packet.typeId === 2) {
        return Math.min(...evaluatedSubpackets);
    } else if (packet.typeId === 3) {
        return Math.max(...evaluatedSubpackets);
    } else if (packet.typeId === 5) {
        return evaluatedSubpackets[0] > evaluatedSubpackets[1] ? 1 : 0;
    } else if (packet.typeId === 6) {
        return evaluatedSubpackets[0] < evaluatedSubpackets[1] ? 1 : 0;
    } else if (packet.typeId === 7) {
        return evaluatedSubpackets[0] === evaluatedSubpackets[1] ? 1 : 0;
    }
}

function parseCompletePacket(hexString: string): Packet {
    const binaryStr = hexString.split('').map(char => HEX_DIGIT_TO_BINARY[char]).join('');
    const [topLevelPacket, rest] = parsePacket(binaryStr);
    assert.match(rest, /0*/, "Unexpected non-zero tail after parse");
    return topLevelPacket;
}

const input: string = loadInput("day_16.input");
const parsed: Packet = parseCompletePacket(input);
console.log("Part 1", sumVersions(parsed));
console.log("Part 2", evalPacket(parsed));