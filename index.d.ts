export type Token = { phrase: string; index: number; };
export type Finder = (sentence: string) => Token[];

export function find(sentence: string, patterns: string[]): Token[];
export function mask(
    sentence: string,
    tokens: Token[],
    style?: "*" | "*-" | "-*" | "-*-" | "*-*"
): string;
export function mask(sentence: string, tokens: Token[], tag: string): string;

export function createFinder(patterns: string[]): Finder;
export function createFinderFromFile(filename: string): Promise<Finder>;