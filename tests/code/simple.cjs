/* eslint-disable require-await */
const { Aligner } = require("../../dist/main");
const test = require('tape');
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const testGroup = 'Simple tests';

const defaultUrl = "https://git.door43.org/MarkHowe/fr_lsg/raw/branch/master/63-1JN.usfm";
const greekUrl = "https://git.door43.org/unfoldingWord/el-x-koine_ugnt/raw/branch/master/63-1JN.usfm";

const getBook = async (url) => {
    const usfm = await fetch(url).then((data) => data.text());
    const bookCode = usfm.match(/\\id ([A-Z0-9]{3}) /)?.[1];
    return { usfm, bookCode };
};

test(
    `import source (${testGroup})`,
    async function (t) {
        try {
            t.plan(1);
            let { usfm, bookCode } = await getBook(greekUrl);
            t.doesNotThrow(() => new Aligner({ sourceText: [usfm, "grk", "ugnt"], targertText: null, verbose: false}));
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `import source and target (${testGroup})`,
    async function (t) {
        try {
            t.plan(1);
            let source = await getBook(greekUrl);
            let target = await getBook(defaultUrl);
            t.doesNotThrow(() => new Aligner({ sourceText: [source.usfm, "grk", "ugnt"], targertText: [target.usfm, "fra", "lsg"], verbose: false}));
        } catch (err) {
            console.log(err);
        }
    },
);