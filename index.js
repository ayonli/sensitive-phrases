/* global XMLHttpRequest */

var fs = null;

/** @typedef {{ phrase: string, index: number }} Token */
/** @typedef {(sentence: string, index: number, length: number) => string} StyleHandler */

/**
 * @param {number} value 
 * @param {[number, number]} intervals
 */
function isBetween(value, intervals) {
    let [min, max] = intervals;
    return value >= min && value < max;
}

/**
 * @param {number} length 
 */
function getMask(length) {
    return new Array(length + 1).join("*");
}

/** @type {StyleHandler} */
function handleStarDashStyle(sentence, index, length) {
    length = Math.round(length / 2);
    return sentence.slice(0, index)
        + getMask(length)
        + sentence.slice(index + length);
}

/** @type {StyleHandler} */
function handleHashStarStyle(sentence, index, length) {
    let _length = Math.round(length / 2);
    return sentence.slice(0, index + length - _length)
        + getMask(_length)
        + sentence.slice(index + length);
}

/**
 * @param {string[]} patterns
 * @returns {(sentence: string) => Token[]}
 */
function createFinder(patterns) {
    /** @type {string[]} */
    let banPatterns = [];
    /** @type {string[]} */
    let bypassPatterns = [];

    for (let pattern of patterns) {
        if (pattern[0] === "!") {
            bypassPatterns.push(pattern.slice(1));
        } else {
            banPatterns.push(pattern);
        }
    }

    let banPattern = new RegExp(banPatterns.join("|"), "ig");
    let bypassPattern = bypassPatterns.length > 0
        ? new RegExp(bypassPatterns.join("|"), "ig")
        : null;

    return function (sentence) {
        /** @type {Token} */
        let banTokens = [];
        /** @type {Token} */
        let bypassTokens = [];
        /** @type {Token} */
        let result = [];

        if (typeof String.prototype["matchAll"] === "function") {
            for (let match of sentence["matchAll"](banPattern)) {
                banTokens.push({ phrase: match[0], index: match.index });
            }

            if (bypassPattern) {
                for (let match of sentence["matchAll"](bypassPattern)) {
                    bypassTokens.push({ phrase: match[0], index: match.index });
                }
            }
        } else {
            // Compatible with JavaScript versions without
            // `String.prototype.matchAll` function.
            sentence.replace(banPattern, (...match) => {
                banTokens.push({
                    phrase: match[0],
                    index: match[match.length - 2]
                });
                return match[0];
            });

            if (bypassPattern) {
                sentence.replace(bypassPattern, (...match) => {
                    bypassTokens.push({
                        phrase: match[0],
                        index: match[match.length - 2]
                    });
                    return match[0];
                });
            }
        }

        if (banTokens.length > 0) {
            for (let { phrase, index } of banTokens) {
                let length = phrase.length;
                let banned = true;

                for (let { phrase: _phrase, index: _index } of bypassTokens) {
                    let _length = _phrase.length;

                    if (_phrase.includes(phrase) &&
                        isBetween(index, [_index, _index + _length])
                    ) {
                        banned = false;
                        break;
                    } else if (isBetween(_index, [index, index + length])) {
                        let __phrase = sentence.slice(
                            Math.min(index, _index),
                            Math.max(index + length, _index + _length)
                        );

                        if (__phrase.includes(_phrase)) {
                            banned = false;
                            break;
                        }
                    }
                }

                if (banned) {
                    result.push({ phrase, index });
                }
            }
        } else {
            result = banTokens;
        }

        return result;
    };
}

/**
 * @param {string} filename 
 */
function createFinderFromFile(filename) {
    return new Promise((resolve, reject) => {
        if (typeof XMLHttpRequest === "function") { // browser
            let xhr = new XMLHttpRequest();

            xhr.timeout = 30 * 1000;
            xhr.onreadystatechange = () => {
                if (xhr.readyState === xhr.DONE) {
                    if ([200, 304].includes(xhr.status)) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error(`Request to '${filename}' failed (`
                            + String(xhr.status)
                            + xhr.statusText ? ` ${xhr.statusText}` : ""
                            + ")"
                        ));
                    }
                }
            };
            xhr.ontimeout = () => {
                reject(new Error(`Request to '${filename}' timeout (30 sec)`));
            };
        } else { // Node.js
            (fs || (fs = require("fs"))).readFile(filename, {
                encoding: "utf8"
            }, (err, data) => err ? reject(err) : resolve(data));
        }
    }).then(contents => {
        return contents.split(/[\r\n]+/)
            .map(line => line.trim())
            .filter(line => !!line && line[0] !== "#")
            .map(line => line.split(/\s+#/)[0]);
    }).then(createFinder);
}

/**
 * @param {string} sentence 
 * @param {string} patterns 
 */
function find(sentence, patterns) {
    return createFinder(patterns)(sentence);
}


/**
 * @param {string} sentence 
 * @param {string} style
 * @param {Token[]} tokens
 * @returns {string}
 */
function mask(sentence, tokens, style = "*") {
    let xmlTagStyle = style.match(/^(<.+?>)(<\/.+?>)$/);
    let offset = 0;

    for (let token of tokens) {
        let { index, phrase } = token;
        let length = phrase.length;
        index += offset;

        if (xmlTagStyle) {
            sentence = sentence.slice(0, index)
                + xmlTagStyle[1]
                + sentence.substr(index, length)
                + xmlTagStyle[2]
                + sentence.slice(index + length);
            offset += xmlTagStyle[0].length;
            continue;
        }

        switch (style) {
            case "*":
                sentence = sentence.slice(0, index)
                    + getMask(length)
                    + sentence.slice(index + length);
                break;

            case "*-":
                sentence = handleStarDashStyle(sentence, index, length);
                break;

            case "-*":
                sentence = handleHashStarStyle(sentence, index, length);
                break;

            case "*-*": {
                if (length < 3) { // use *- style
                    sentence = handleStarDashStyle(sentence, index, length);
                } else {
                    let _length = Math.round(length / 3);
                    sentence = sentence.slice(0, index)
                        + getMask(_length)
                        + sentence.substr(index + _length, length - _length * 2)
                        + getMask(_length)
                        + sentence.slice(index + length);
                }

                break;
            }

            case "-*-": {
                if (length < 3) { // use -* style
                    sentence = handleHashStarStyle(sentence, index, length);
                } else {
                    let _length = Math.ceil(length / 3);
                    let __length = (length - _length) / 2;
                    sentence = sentence.slice(0, index + __length)
                        + getMask(_length)
                        + sentence.slice(index + _length + __length);
                }

                break;
            }
        }
    }

    return sentence;
}

exports.createFinder = createFinder;
exports.createFinderFromFile = createFinderFromFile;
exports.find = find;
exports.mask = mask;