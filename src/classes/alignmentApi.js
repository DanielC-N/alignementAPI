// import { Proskomma } from 'proskomma-cross';
import ProskommaInterface from './ProskommaInterface';
// let ProskommaInterface = require('./ProskommaInterface');
// import Epitelete from 'epitelete';
// import { PipelineHandler } from 'proskomma-json-tools';

class Aligner {
    /**
     *
     * @param {String[]} sourceUsfm - source raw str/json, code lang and abbr
     * @param {String[]} targetUsfm - target raw str/json, code lang and abbr
     * @param {boolean} verbose
    */
    constructor({sourceText=[], targetText=[], verbose=false}) {
        this.numberVersesInChapters = [];
        this.numChapters = 0;
        this.numVersesOfCurrentChapter = 0;
        this.proskommaInterface = new ProskommaInterface();
        this.bookCodeSrc, this.docSetIdSrc, this.bookCodeTrg, this.docSetIdTrg = "";
        if(sourceText[0] != null) {
            let resRaw = this.proskommaInterface.addRawDocument(sourceText[0], sourceText[1], sourceText[2]);
            this.bookCodeSrc = resRaw[0];
            this.docSetIdSrc = resRaw[1];
            this.sourceText = sourceText[0];
        } else {
            this.sourceText = "";
        }
        if(targetText[0] != null) {
            resRaw = this.proskommaInterface.addRawDocument(targetText[0], targetText[1], targetText[2]);
            this.bookCodeTrg = resRaw[0];
            this.docSetIdTrg = resRaw[1];
            this.targetText = targetText[0];
            if(bookCodeSrc !== "" && bookCodeTrg !== "" && bookCodeSrc != bookCodeTrg) {
                throw new Error("the book code doesn't match. Are you trying to align two different books ?");
            } else {
                let resintegrity = this.checkIntegrity(docSetIdSrc, bookCodeSrc, docSetIdTrg, bookCodeTrg);
                let isGood = resintegrity[0];
                if(!isGood) {
                    throw Error("the source book does not match the number of chapters/verses of the target book\n", "src ==", resintegrity[1], "| target ==", resintegrity[2]);
                }
                this.numberVersesInChapters = resintegrity[1];
                this.numVersesOfCurrentChapter = this.numberVersesInChapters[0].length;
                this.bookCode = bookCodeSrc;
            }
        } else {
            this.targetText = "";
        }
        
        this.currentChapter = 1;
        this.currentVerse = 1;
        this.currentReference = this.generateReference();
        this.idtexts = [this.docSetIdSrc, this.docSetIdTrg];
        this.currentSourceSentence = [];
        this.currentSourceSentenceStr = "";
        this.currentTargetSentence = [];
        this.currentTargetSentenceStr = "";
        this.verbose = verbose;
        this.AlignementJSON = JSON.parse("{}");
    }

    setTargetText(raw, codeLang, abbr) {
        resRaw = this.proskommaInterface.addRawDocument(raw, codeLang, abbr);
        this.bookCodeTrg = resRaw[0];
        this.docSetIdTrg = resRaw[1];
        this.targetText = raw;
        if(this.bookCodeSrc !== "" && this.bookCodeTrg !== "" && this.bookCodeSrc != this.bookCodeTrg) {
            throw new Error("the book code doesn't match. Are you trying to align two different books ?");
        } else {
            let resintegrity = this.checkIntegrity(this.docSetIdSrc, this.bookCodeSrc, this.docSetIdTrg, this.bookCodeTrg);
            let isGood = resintegrity[0];
            if(!isGood) {
                throw Error("the source book does not match the number of chapters/verses of the target book\n", "src ==", resintegrity[1], "| target ==", resintegrity[2]);
            }
            this.numberVersesInChapters = resintegrity[1];
            this.numVersesOfCurrentChapter = this.numberVersesInChapters[0].length;
            this.bookCode = bookCodeSrc;
        }
    }

    /**
     * 
     * @returns {string[]}
     */
    getCurrentTargetSentence() {
        return this.currentTargetSentence;
    }

    /**
     * 
     * @returns {string[]}
     */
    getCurrentSourceSentence() {
        return this.currentSourceSentence;
    }

    getCurrentChapter() {
        return this.currentChapter;
    }

    getCurrentVerse() {
        return this.currentVerse;
    }

    getCurrentReference() {
        return this.currentReference;
    }

    getNumberOfChapters() {
        return this.numberVersesInChapters.length;
    }

    getNumberOfVersesInCurrentChapter() {
        return this.numberVersesInChapters[this.currentChapter-1];
    }

    getNumberVersesInChapters() {
        return this.numberVersesInChapters;
    }

    setNumberVersesInChapters() {
        this.numberVersesInChapters = this.countVersesInChapters()[1];
    }

    setCurrentChapter(chapterInt) {
        this.currentChapter = chapterInt;
        this.generateReference();
    }

    setCurrentVerse(verseInt) {
        this.currentVerse = verseInt;
        this.generateReference();
    }

    /**
     * get the source text from proskomma instance in usfm (default) or perf
     * @param {string} type "usfm" or "perf"
     * @returns {string}
     */
    async getSourceText(type="usfm") {
        let res = await this.proskommaInterfaceSource.queryPk(`{documents(ids:"${this.idtexts[0]}") {${type}}}`);
        return res;
    }

    /**
     * get the source text from proskomma instance in usfm (default) or perf
     * @param {string} type "usfm" or "perf"
     * @returns {string}
     */
    async getTargetText(type="usfm") {
        let res = await this.proskommaInterfaceSource.queryPk(`{documents(ids:"${this.idtexts[1]}") {${type}}}`);
        return res;
    }

    resetAlignment() {
        this.AlignementJSON[this.currentReference]["alignments"] = {};
    }

    fullResetAlignment() {
        this.AlignementJSON = JSON.parse("{}");
    }

    checkIntegrity(docSetIdSrc, bookCodeSrc, docSetIdTrg,bookCodeTrg) {
        let nbSrc = countVersesInChapters(docSetIdSrc, bookCodeSrc);
        let nbTrg = countVersesInChapters(docSetIdTrg, bookCodeTrg);

        if(nbSrc.length != nbTrg.length) {
            return false;
        } else {
            this.numChapters = nbSrc.length;
        }
        return [JSON.stringify(nbSrc.slice()) === JSON.stringify(nbTrg.slice()), nbSrc, nbTrg];
    }

    /**
     * change the source chapter/verse to align
     * @param {int} cint chapter
     * @param {int} vint verse
     */
    async setChapterVerse(cint, vint) {
        this.setCurrentChapter(cint);
        this.setCurrentVerse(vint);
        this.generateReference();

        this.setCurrentSourceSentence(await getVerseFromCV(this.docSetIdSrc, this.bookCode, cint, vint));
        this.setCurrentTargetSentence(await getVerseFromCV(this.docSetIdTrg, this.bookCode, cint, vint));
    }

    /**
     * 
     * @param {string[]|string} sentence the sentence for alignment
     * @param {string} sentenceStr if 'sentence' is an object, please provide the input sentence str
     */
    setCurrentSourceSentence(sentence, sentenceStr="") {
        this.generateReference();
        if(typeof sentence === "object" && sentence[0] != null && typeof sentence[0] === "string") {
            if(sentenceStr == "") {
                throw new Error("Please provide the string of the source sentence (2nd argument : 'sentenceStr')");
            }
            this.currentSourceSentence = sentence;
            this.currentSourceSentenceStr = sentenceStr;
        } else if (typeof sentence === "string") {
            this.currentSourceSentence = sentence.trim().split(/\n|[ ,-]/g).filter(element => {
                return element.trim() !== "";
            });
            this.currentSourceSentenceStr = sentence;
        }
        if(!this.AlignementJSON[this.currentReference]) {
            this.generateTemplateJson();
        } else {
            if(!this.AlignementJSON[this.currentReference]["sourceText"]
                || (this.AlignementJSON[this.currentReference]["sourceText"] && this.AlignementJSON[this.currentReference]["sourceText"] == "")) {
                this.AlignementJSON[this.currentReference]["sourceText"] = this.currentSourceSentenceStr;
            }
        }
    }

    /**
     * 
     * @param {string[]|string} sentence the sentence for alignment
     * @param {string} sentenceStr if 'sentence' is an object, please provide the input sentence str
     */
    setCurrentTargetSentence(sentence, sentenceStr="") {
        this.generateReference();
        if(typeof sentence === "object" && sentence[0] != null && typeof sentence[0] === "string") {
            this.currentTargetSentence = sentence;
            this.currentTargetSentenceStr = sentenceStr;
        } else if (typeof sentence === "string") {
            this.currentTargetSentence = sentence.trim().split(/\n|[ ,-]/g).filter(element => {
                return element.trim() !== "";
            });
            this.currentTargetSentenceStr = sentence;
        }
        if(!this.AlignementJSON[this.currentReference]) {
            this.generateTemplateJson();
        } else {
            if(!this.AlignementJSON[this.currentReference]["targetText"]
                || (this.AlignementJSON[this.currentReference]["targetText"] && this.AlignementJSON[this.currentReference]["targetText"] == "")) {
                this.AlignementJSON[this.currentReference]["targetText"] = this.currentTargetSentenceStr;
            }
        }
    }

    /**
     * Get a well formated JSON word alignment informations
     * @returns {JSON}
     */
    getAlignmentJSON() {
        return this.AlignementJSON;
    }

    /**
     * Align two words and add the information to the final JSON
     * @param {int} sourceIndex the index of the SOURCE language to align
     * @param {int} targetIndex the index of the TARGET language to align
     */
    addAlignment(sourceIndex, targetIndex) {
        this.generateReference();
        let sWord = this.currentSourceSentence[sourceIndex];
        let tWord = this.currentTargetSentence[targetIndex];
        if(!this.AlignementJSON[this.currentReference]["alignments"][sWord]) {
            this.AlignementJSON[this.currentReference]["alignments"][sWord] = this.generateTemplateAlign(
                sWord,
                tWord,
                sourceIndex,
                targetIndex,
            );
        } else {
            this.AlignementJSON[this.currentReference]["alignments"][sWord]["targetWords"].push(tWord);
            this.AlignementJSON[this.currentReference]["alignments"][sWord]["targetIndexes"].push(targetIndex);
        }
    }

    /**
     * 
     * @param {int} sourceIndex the index of the SOURCE language to UNalign
     * @param {int} targetIndex the index of the TARGET language to UNalign
     * @returns nothing
     */
    removeAlignment(sourceIndex, targetIndex) {
        this.generateReference();
        let sWord = this.currentSourceSentence[sourceIndex];
        let tWord = this.currentTargetSentence[targetIndex];

        // removing the word from 'targetWords'
        let index = this.AlignementJSON[this.currentReference]["alignments"][sWord]["targetWords"].indexOf(tWord);
        if (index !== -1) {
            this.AlignementJSON[this.currentReference]["alignments"][sWord]["targetWords"].splice(index, 1);
            
            // if the array of the current alignement is empty, we completely
            // remove the entry "sWord"
            if(this.AlignementJSON[this.currentReference]["alignments"][sWord]["targetWords"][0] == null) {
                delete this.AlignementJSON[this.currentReference]["alignments"][sWord];
                return;
            }
            
            this.AlignementJSON[this.currentReference]["alignments"][sWord]["targetIndexes"].splice(index, 1);
        }
    }

    generateReference() {
        let cc = this.currentChapter.toString();
        let cv = this.currentVerse.toString();
        if(this.currentChapter > 0 && this.currentChapter < 10) {
            cc = "00"+cc;
        } else if (this.currentChapter > 10 && this.currentChapter < 100) {
            cc = "0"+cc;
        }

        if(this.currentVerse > 0 && this.currentVerse < 10) {
            cv = "00"+cv;
        } else if (this.currentVerse > 10 && this.currentVerse < 100) {
            cv = "0"+cv;
        }

        this.currentReference = cc+cv;
    }

    countVersesInChapters(docSetId="", bookCode="") {
        if(!docSetId[0]) {
            docSetId = this.idtexts[0];
        }
        if(!bookCode[0]) {
            bookCode = this.bookCode;
        }
        
        const verseQuery =
        `{ docSet (id: "${docSetId}") { document(bookCode:"${bookCode}") {` +
        `    cvIndexes { verseNumbers { number } } } } }`;
        const { data } = this.proskommaInterface.queryPkSync(verseQuery);

        let cvI = data.docSet.document.cvIndexes;
        let numVerses = [];
        for (let i = 0; i < cvI.length; i++) {
            numVerses.push(cvI[i].verseNumbers.length);
        }

        return numVerses;
    }

    /**
     * 
     * @param {string} reference string in format chapterVerse. Ex : '001001' (chapter 1, verse 1)
     * @param {string} sourceWord the source word of the alignment
     * @param {string} targetWord the target word of the alignment
     * @param {int} sourceIndex
     * @param {int} targetIndex
     */
    generateTemplateJson() {
        this.generateReference();
        this.AlignementJSON[this.currentReference] = {
            "sourceText": this.currentSourceSentenceStr,
            "targetText": this.currentTargetSentenceStr,
            "alignments": {}
        }
    }

    /**
     * 
     * @param {string} sourceWord 
     * @param {string} targetWord 
     * @param {int} sourceIndex 
     * @param {int} targetIndex 
     * @returns 
     */
    generateTemplateAlign(sourceWord, targetWord, sourceIndex, targetIndex) {
        return {
            "sourceWord": sourceWord,
            "targetWords": [targetWord],
            "sourceIndex": sourceIndex,
            "targetIndexes": [targetIndex]
        }
    }
}

module.exports = { Aligner };