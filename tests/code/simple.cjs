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
            t.doesNotThrow(() => new Aligner({ sourceText: [usfm, "grk", "ugnt"], targetText: [], verbose: false}));
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
            t.doesNotThrow(() => new Aligner({ sourceText: [source.usfm, "grk", "ugnt"], targetText: [target.usfm, "fra", "lsg"], verbose: false}));
        } catch (err) {
            console.log(err);
        }
    },
);

const srcFirstLine = "\\id 1JN unfoldingWord® Greek New Testament";
const trgFirstLine = "\\id 1JN 1JNFLS1910.PTX, Louis Segond 1910, French, 31-10-2011, Moon Sun Kim. Updated for DBL by E. Canales, September 2012.";

test(
    `check source and target texts (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            let source = await getBook(greekUrl);
            let target = await getBook(defaultUrl);
            let align = new Aligner({ sourceText: [source.usfm, "grk", "ugnt"], targetText: [target.usfm, "fra", "lsg"], verbose: false});
            let sourceUsfm = await align.getSourceText();
            let targetUsfm = await align.getTargetText();
            t.equal(sourceUsfm.split("\n")[0], srcFirstLine);
            t.equal(targetUsfm.split("\n")[0], trgFirstLine);
        } catch (err) {
            console.log(err);
        }
    },
);