# Sensitive Phrases

**Find and mask sensitive phrases in a sentence.**

Unlike other silly tools just blindly warn about sensitive words and/or delete
them, this module can brilliantly point out which and where the sensitive
phrases are, and bypass some phrases that should not be considered sensitive.
At the mean time, this module provides a straight-forward and yet customizable
mask function that help you handle any sensitive phrases found.

## Install

```sh
npm i sensitive-phrases
```

## Example

*NOTE: the following example uses Chinese language.*

```js
import * as assert from "assert";
import { find, mask } from "sensitive-phrases";

let patterns = [
    "草泥马",
    "!(一)?(头|只)草泥马", // a pattern starts with `!` indicates it should be bypassed
    "操(尼玛|你妈)?",
    "!(体|广播)操",
    "!操(练|场)"
];
let tokens = find(
    "操，草泥马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操",
    patterns
);

assert.deepStrictEqual(tokens, [
    { phrase: "操", index: 0 },
    { phrase: "草泥马", index: 2 }
]);

let result = mask(sentence, tokens);

assert.strictEqual(
    result,
    "*，***，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操"
);

// Use a pair of HTML tag to highlight the sensitive patterns.
result = mask(sentence, tokens, "<s></s>");

assert.strictEqual(
    result,
    "<s>操</s>，<s>草泥马</s>，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操"
);
```

*NOTE: for more examples, check the [test cases](./test/index.js).*

## API

Before listing all the functions one by one, take a look at the type
declarations:

```ts
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
```

### `find()`

This function finds and lists all sensitive phrases in a sentence. Instead of
using plain words, this module uses patterns that is compatible with and will
eventually be concatenated and compiled to regular expressions.

There are two types of patterns supported by this module, one indicates
sensitive, and the other for bypass. Any pattern that starts with `!` will not
be considered sensitive, and the find function has a special method to deal with
conflicts under the hood. 

### `mask()`

This function masks the sensitive phrases found by the `find()` function, and it
supports multiple styles:

- `*` Masks the whole phrase with asterisks (`*`), this is the default style.
- `*-` Masks the head of the phrase and leave along the tail.
- `-*` Masks the tail of the phrase and leave along the head.
- `-*-` Masks the central part of the phrase and leave along the head and tail.
- `*-*` Masks the head and tail of the phrase and leave along the central part.

Other than styles, this function also accepts a pair of XML/HTML tag (with or
without attributes) that will wrap and highlight the sensitive phrases.

### `createFinder()`

This function creates a static find function with the given patterns, so that
the program won't have to compile the patterns every time.

### `createFinderFromFile()`

Similar to `createFinder()`, but it loads the patterns from a file. In Node.js,
it uses `fs.readFile()` to read the file, and in browsers (YES this module fully
supports browsers), it uses `XMLHttpRequest` to load internet files.

Also, this function supports comments start with `#` in the file, and they will
not be used as patterns.