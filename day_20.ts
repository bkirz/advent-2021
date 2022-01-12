import assert from "assert";
import { loadInput, Hashable, HashValue, ImmutableSet, minmax } from "./helpers";

const ALGORITHM_STRING_LENGTH = 512;

/*  Data Model:
 *  - Image coordinates use the top-left corner of the original pixelSet as (0,0)
 *    with x increasing to the right and y increasing downwards.
 *  - Images are modeled using:
 *      - a tuple of a Set of coordinates of ON pixels within a set of tracked bounds.
 *      - a boolean state tracking the state of all pixels out of tracked bounds,
 *        necessary to model the case where bit 0 is ON in the algorithm string.
 */

type AlgorithmString = string;
type PixelSet = ImmutableSet<Pixel>;
type Bounds = {x: {min: number, max: number}, y: {min: number, max: number}};

class Image {
    readonly pixels: PixelSet;
    readonly bounds: Bounds;
    readonly outOfBoundsOn: boolean;

    constructor(pixels: PixelSet, outOfBoundsOn: boolean) {
        this.pixels = pixels;
        this.bounds = pixelSetBounds(pixels);
        this.outOfBoundsOn = outOfBoundsOn;
    }

    has(pixel: Pixel): boolean {
        if (this.bounds.x.min <= pixel.x && pixel.x <= this.bounds.x.max &&
                this.bounds.y.min <= pixel.y && pixel.y <= this.bounds.y.max) {
            return this.pixels.has(pixel);
        } else {
            return this.outOfBoundsOn;
        }
    }
}

const ON_CHAR = '#';

class Pixel implements Hashable {
    readonly x: number;
    readonly y: number;

    static allPixels: Map<HashValue, Pixel> = new Map();

    static of(x: number, y: number) {
        const hash = Pixel.hash(x, y);
        if (this.allPixels.has(hash)) {
            return this.allPixels.get(hash);
        } else {
            const pixel = new Pixel(x, y);
            this.allPixels.set(hash, pixel);
            return pixel;
        }
    }

    private constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static hash(x: number, y: number): HashValue { return `(${x}:${y})`; }
    hash(): HashValue { return Pixel.hash(this.x, this.y); }
}

function imageFromLines(lines: string[]): Image {
    const pixelSet = new ImmutableSet([...lines.flatMap( (rowStr, rowIndex) => {
        return rowStr.split('').flatMap( (char, colIndex) => {
            return char === ON_CHAR ? [Pixel.of(colIndex, rowIndex)] : [];
        });
    })]);

    // The entire grid begins in the OFF state by default.
    return new Image(pixelSet, false);
}

function enhance(image: Image, algorithm: string): Image {
    function isEnabled(pixel: Pixel, image: Image, algorithm: AlgorithmString): boolean {
        const pixelsInBitOrder = [
            Pixel.of(pixel.x - 1, pixel.y - 1), Pixel.of(pixel.x, pixel.y - 1), Pixel.of(pixel.x + 1, pixel.y - 1),
            Pixel.of(pixel.x - 1, pixel.y),     pixel,                          Pixel.of(pixel.x + 1, pixel.y),
            Pixel.of(pixel.x - 1, pixel.y + 1), Pixel.of(pixel.x, pixel.y + 1), Pixel.of(pixel.x + 1, pixel.y + 1),
        ];

        const bitString = pixelsInBitOrder.map(pixel => image.has(pixel) ? '1' : '0').join('');
        const position = parseInt(bitString, 2);
        return algorithm.charAt(position) === ON_CHAR;
    }

    const bounds = pixelSetExtendedBounds(image.pixels);
    const newPixels = [];

    for (let x = bounds.x.min; x <= bounds.x.max; x++) {
        for (let y = bounds.y.min; y <= bounds.y.max; y++) {
            const pixel = Pixel.of(x, y);
            if (isEnabled(pixel, image, algorithm)) { newPixels.push(pixel); }
        }
    }

    const newOutOfBoundsBitPosition = image.outOfBoundsOn ? 511 : 0;
    const newOutOfBounds = algorithm.charAt(newOutOfBoundsBitPosition) === ON_CHAR;

    return new Image(new ImmutableSet(newPixels), newOutOfBounds);
}

function pixelSetBounds(pixelSet: PixelSet): Bounds {
    const pixels: Pixel[] = [...pixelSet];
    const [xMin, xMax]: [number, number] = minmax(pixels.map(p => p.x));
    const [yMin, yMax]: [number, number] = minmax(pixels.map(p => p.y));

    return {x: {min: xMin, max: xMax}, y: {min: yMin, max: yMax}};
}

// Extends bounds one pixel beyond the min/max in every direction.
// Useful for both formatting output and generating the next cycle of pixels.
function pixelSetExtendedBounds(pixelSet: PixelSet): Bounds {
    const {x: {min: xMin, max: xMax}, y: {min: yMin, max: yMax}} = pixelSetBounds(pixelSet);
    return {x: {min: xMin - 1, max: xMax + 1}, y: {min: yMin - 1, max: yMax + 1}};
}

function format(image: Image): string {
    const buffer = [];
    const bounds = pixelSetExtendedBounds(image.pixels);
    for (let y = bounds.y.min; y <= bounds.y.max; y++) {
        for (let x = bounds.x.min; x <= bounds.x.max; x++) {
            const pixel = Pixel.of(x, y);
            buffer.push(image.has(pixel) ? '#' : '.');
        }
        buffer.push("\n");
    }

    return buffer.join('');
}

function parseInput(input: string): [Image, AlgorithmString] {
    const [algorithmString, _, ...inputImageLines] = input.split("\n");
    assert.equal(algorithmString.length, ALGORITHM_STRING_LENGTH);
    const image: Image = imageFromLines(inputImageLines);
    return [image, algorithmString];
}

function part1(input: string) {
    const [image, algorithmString] = parseInput(input);
    console.log("Starting Image");
    console.log(format(image));
    console.log("First pass");
    const enhancedOnce = enhance(image, algorithmString);
    console.log(format(enhancedOnce));
    console.log("Second pass");
    const enhancedTwice = enhance(enhancedOnce, algorithmString);
    console.log(format(enhancedTwice));

    console.log("Part 1", [...enhancedTwice.pixels].length);
}

function part2(input: string) {
    const [startImage, algorithmString] = parseInput(input);
    let image = startImage;
    for (let iteration = 0; iteration < 50; iteration++) {
        image = enhance(image, algorithmString);
    }
    console.log("Part 2", [...image.pixels].length);
}

const testInput = `..#.#..#####.#.#.#.###.##.....###.##.#..###.####..#####..#....#..#..##..###..######.###...####..#..#####..##..#.#####...##.#.#..#.##..#.#......#.###.######.###.####...#.##.##..#..#..#####.....#.#....###..#.##......#.....#..#..#..##..#...##.######.####.####.#.#...#.......#..#.#.#...####.##.#......#..#...##.#.##..#...##.#.##..###.#......#.#.......#.#.#.####.###.##...#.....####.#..#..#.##.#....##..#.####....##...##..#...#......#.#.......#.......##..####..#...#.#.#...##..#.#..###..#####........#..####......#..#

#..#.
#....
##..#
..#..
..###`;

const realInput = loadInput("day_20.input");

part1(testInput);
part1(realInput);
part2(testInput);
part2(realInput);