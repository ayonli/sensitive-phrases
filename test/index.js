/* global describe, it */
const assert = require("assert");
const { find, mask, createFinder, createFinderFromFile } = require("..");

describe("find()", () => {
    it("should find sensitive phrases", () => {
        let patterns = [
            "草泥马"
        ];
        let tokens = find("真是草泥马，心中有千万只草泥马奔腾而过", patterns);

        assert.deepStrictEqual(tokens, [
            { phrase: "草泥马", index: 2 },
            { phrase: "草泥马", index: 12 }
        ]);
    });

    it("should find sensitive phrases but bypass some phrases", () => {
        let patterns = [
            "草泥马",
            "!(一)?(头|只)草泥马"
        ];
        let tokens = find("真是草泥马，心中有千万只草泥马奔腾而过", patterns);

        assert.deepStrictEqual(tokens, [
            { phrase: "草泥马", index: 2 }
        ]);
    });

    it("should find even more sensitive phrases any bypass more phrases", () => {
        let patterns = [
            "草泥马",
            "!(一)?(头|只)草泥马",
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
    });
});

describe("mask()", () => {
    it("should mask sensitive phrases with '*' style", () => {
        let sentence = "操，草泥马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操";
        let patterns = [
            "草泥马",
            "!(一)?(头|只)草泥马",
            "操(尼玛|你妈)?",
            "!(体|广播)操",
            "!操(练|场)"
        ];
        let tokens = find(sentence, patterns);
        let result = mask(sentence, tokens);

        assert.strictEqual(
            result,
            "*，***，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操"
        );
    });

    it("should mask sensitive phrases with '*-' style", () => {
        let sentence = "操，草泥马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操";
        let patterns = [
            "草泥马",
            "!(一)?(头|只)草泥马",
            "操(尼玛|你妈)?",
            "!(体|广播)操",
            "!操(练|场)"
        ];
        let tokens = find(sentence, patterns);
        let result = mask(sentence, tokens, "*-");

        assert.strictEqual(
            result,
            "*，**马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操"
        );
    });

    it("should mask sensitive phrases with '-*' style", () => {
        let sentence = "操，草泥马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操";
        let patterns = [
            "草泥马",
            "!(一)?(头|只)草泥马",
            "操(尼玛|你妈)?",
            "!(体|广播)操",
            "!操(练|场)"
        ];
        let tokens = find(sentence, patterns);
        let result = mask(sentence, tokens, "-*");

        assert.strictEqual(
            result,
            "*，草**，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操"
        );
    });

    it("should mask sensitive phrases with '*-*' style", () => {
        let sentence = "操，草泥马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操";
        let patterns = [
            "草泥马",
            "!(一)?(头|只)草泥马",
            "操(尼玛|你妈)?",
            "!(体|广播)操",
            "!操(练|场)"
        ];
        let tokens = find(sentence, patterns);
        let result = mask(sentence, tokens, "*-*");

        assert.strictEqual(
            result,
            "*，*泥*，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操"
        );
    });

    it("should mask sensitive phrases with '-*-' style", () => {
        let sentence = "操，草泥马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操";
        let patterns = [
            "草泥马",
            "!(一)?(头|只)草泥马",
            "操(尼玛|你妈)?",
            "!(体|广播)操",
            "!操(练|场)"
        ];
        let tokens = find(sentence, patterns);
        let result = mask(sentence, tokens, "-*-");

        assert.strictEqual(
            result,
            "*，草*马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操"
        );
    });

    it("should mask sensitive phrases with '<s></s>'", () => {
        let sentence = "操，草泥马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操";
        let patterns = [
            "草泥马",
            "!(一)?(头|只)草泥马",
            "操(尼玛|你妈)?",
            "!(体|广播)操",
            "!操(练|场)"
        ];
        let tokens = find(sentence, patterns);
        let result = mask(sentence, tokens, "<s></s>");

        assert.strictEqual(
            result,
            "<s>操</s>，<s>草泥马</s>，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操"
        );
    });

    it("should mask sensitive phrases with '<s class=\"red\"></s>'", () => {
        let sentence = "操，草泥马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操";
        let patterns = [
            "草泥马",
            "!(一)?(头|只)草泥马",
            "操(尼玛|你妈)?",
            "!(体|广播)操",
            "!操(练|场)"
        ];
        let tokens = find(sentence, patterns);
        let result = mask(sentence, tokens, "<s class=\"red\"></s>");

        assert.strictEqual(
            result,
            "<s class=\"red\">操</s>，<s class=\"red\">草泥马</s>，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操"
        );
    });
});

describe("createFinder()", () => {
    it("should create a find function with sensitive phrases", () => {
        let patterns = [
            "草泥马"
        ];
        let find = createFinder(patterns);
        let tokens = find("真是草泥马，心中有千万只草泥马奔腾而过");

        assert.deepStrictEqual(tokens, [
            { phrase: "草泥马", index: 2 },
            { phrase: "草泥马", index: 12 }
        ]);
    });
});

describe("createFinderFromFile()", () => {
    it("should create a find function from a file", () => {
        return createFinderFromFile(__dirname + "/blacklist.lst").then(find => {
            let tokens = find(
                "操，草泥马，心中有千万只草泥马奔腾而过，你只能在操场操练广播操或体操"
            );

            assert.deepStrictEqual(tokens, [
                { phrase: "操", index: 0 },
                { phrase: "草泥马", index: 2 }
            ]);
        });
    });
});