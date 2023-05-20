/* eslint-disable require-await */
const { Aligner } = require("../../dist/main");
const test = require('tape');
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const testGroup = 'Simple tests';

const defaultUrl = "https://raw.githubusercontent.com/DanielC-N/alignementAPI/update/tests/data/63-1JN_stripped.usfm";
const greekUrl = "https://git.door43.org/unfoldingWord/el-x-koine_ugnt/raw/branch/master/63-1JN.usfm";

let alignerTool = null;

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
            console.error(err);
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
            console.error(err);
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
            alignerTool = new Aligner({ sourceText: [source.usfm, "grk", "ugnt"], targetText: [target.usfm, "fra", "lsg"], verbose: false});
            let sourceUsfm = await alignerTool.getSourceText();
            let targetUsfm = await alignerTool.getTargetText();
            t.equal(sourceUsfm.split("\n")[0], srcFirstLine);
            t.equal(targetUsfm.split("\n")[0], trgFirstLine);
        } catch (err) {
            console.error(err);
        }
    },
);

test(
    `setChapterVerse checks (${testGroup})`,
    async function (t) {
        t.plan(5);
        if(!alignerTool) {
            let source = await getBook(greekUrl);
            let target = await getBook(defaultUrl);
            alignerTool = new Aligner({ sourceText: [source.usfm, "grk", "ugnt"], targetText: [target.usfm, "fra", "lsg"], verbose: false});
        }
        try {
            await await alignerTool.setChapterVerse(2, 2);
            await await alignerTool.setChapterVerse(5, 10);
            t.ok("ok");
        } catch (err) {
            t.notok("await alignerTool.setChapterVerse(2, 2) and await alignerTool.setChapterVerse(5, 10) should've worked", err);
        }
        try {
            await alignerTool.setChapterVerse(41, 2);
            t.notok("alignerTool.setChapterVerse(41, 2) should've not worked");
        } catch (err) {
            t.ok("ok");
        }
        try {
            await alignerTool.setChapterVerse(0, 2);
            t.notok("alignerTool.setChapterVerse(0, 2) should've not worked");
        } catch (err) {
            t.ok("ok");
        }
        try {
            await alignerTool.setChapterVerse(1, null);
            t.notok("alignerTool.setChapterVerse(1, null) should've not worked");
        } catch (err) {
            t.ok("ok");
        }
        try {
            await alignerTool.setChapterVerse(undefined, null);
            t.notok("alignerTool.setChapterVerse(undefined, null) should've not worked");
        } catch (err) {
            t.ok("ok");
        }
    },
);

test(
    `basic functionnality checks (${testGroup})`,
    async function (t) {
        try {
            t.plan(10);
            if(!alignerTool) {
                let source = await getBook(greekUrl);
                let target = await getBook(defaultUrl);
                alignerTool = new Aligner({ sourceText: [source.usfm, "grk", "ugnt"], targetText: [target.usfm, "fra", "lsg"], verbose: false});
            }
            await alignerTool.setChapterVerse(2, 2);
            t.equal(alignerTool.getNumberOfChapters(), 5);
            t.equal(alignerTool.getBookCode(), "1JN");
            t.equal(alignerTool.getCurrentChapter(), 2);
            t.equal(alignerTool.getNumberOfChapters(), 5);
            t.equal(alignerTool.getCurrentVerse(), 2);
            t.equal(alignerTool.getNumberOfVersesInCurrentChapter(), 29);
            t.equal(alignerTool.getCurrentReference(), "002002");
            t.equal(alignerTool.getCurrentSourceSentenceStr(), "καὶ αὐτὸς ἱλασμός ἐστιν περὶ τῶν ἁμαρτιῶν ἡμῶν, οὐ περὶ τῶν ἡμετέρων δὲ μόνον, ἀλλὰ καὶ περὶ ὅλου τοῦ κόσμου.");
            t.equal(alignerTool.getCurrentTargetSentenceStr(), "Il est lui-même une victime expiatoire pour nos péchés, non seulement pour les nôtres, mais aussi pour ceux du monde entier.");
            t.equal(Array.toString(alignerTool.getNumberVersesInChapters()), Array.toString([10, 29, 24, 21, 21]));
        } catch (err) {
            console.error(err);
        }
    },
);

test(
    `alignment checks (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            let source = await getBook(greekUrl);
            let target = await getBook(defaultUrl);
            let alignerToolTwo = new Aligner({ sourceText: [source.usfm, "grk", "ugnt"], targetText: [target.usfm, "fra", "lsg"], verbose: false});
            t.doesNotThrow(async () => {
                await alignerToolTwo.setChapterVerse(2, 2);
                alignerToolTwo.addAlignment(0,0);
                alignerToolTwo.addAlignment(0,1);
                alignerToolTwo.addAlignment(1,2);
                alignerToolTwo.addAlignment(2,4);
                alignerToolTwo.addAlignment(2,5);
                alignerToolTwo.addAlignment(2,6);
                alignerToolTwo.removeAlignment(1,3); // wrong alignment ref
                await alignerToolTwo.setChapterVerse(3, 10);
                await alignerToolTwo.setChapterVerse(3, 11);
                alignerToolTwo.addAlignment(0,0);
                alignerToolTwo.removeAlignment(1,3); // wrong unalignment ref does not throw
                alignerToolTwo.resetAlignment();
                alignerToolTwo.fullResetAlignment();
            });
            t.equal(JSON.stringify(alignerToolTwo.getAlignmentJSON()), "{}");
        } catch (err) {
            // console.log(err);
        }
    },
);

test(
    `getSourceText and getTargetText tests in perf (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            if(!alignerTool) {
                let source = await getBook(greekUrl);
                let target = await getBook(defaultUrl);
                alignerTool = new Aligner({ sourceText: [source.usfm, "grk", "ugnt"], targetText: [target.usfm, "fra", "lsg"], verbose: false});
            }
            let srcPerf = JSON.parse(await alignerTool.getSourceText("perf"));
            let trgPerf = JSON.parse(await alignerTool.getTargetText("perf"));
            t.equal(JSON.stringify(alignerTool.getAlignmentJSON()), "{}");
            t.equal(srcPerf.metadata.document.bookCode, "1JN");
            t.equal(trgPerf.metadata.document.h, "1 JEAN");
        } catch (err) {
            console.error(err);
        }
    },
);

test.only(
    `alignment report to usfm tests tests in perf (${testGroup})`,
    async function (t) {

        try {
            t.plan(1);
            if(!alignerTool) {
                let source = await getBook(greekUrl);
                let target = await getBook(defaultUrl);
                alignerTool = new Aligner({ sourceText: [source.usfm, "grk", "ugnt"], targetText: [target.usfm, "fra", "lsg"], verbose: false});
            }
            t.equal(JSON.stringify(alignerTool.getAlignmentJSON()), "{}");
            await alignerTool.setChapterVerse(1,1);
            alignerTool.addAlignment(0,0);
            alignerTool.addAlignment(0,1);
            alignerTool.addAlignment(1,2);
            alignerTool.addAlignment(2,4);
            alignerTool.addAlignment(2,5);
            alignerTool.addAlignment(2,6);
            await alignerTool.setChapterVerse(2,2);
            alignerTool.addAlignment(0,0);
            alignerTool.addAlignment(0,1);
            alignerTool.addAlignment(1,2);
            alignerTool.addAlignment(2,4);
            alignerTool.addAlignment(2,5);
            alignerTool.addAlignment(2,6);
            
            let output = await alignerTool.generateAlignedUsfm();
            // let perfOut = output.perf;
            console.log(output.report[1][1]);
        } catch (err) {
            console.error(err);
        }
    },
);