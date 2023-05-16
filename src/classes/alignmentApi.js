import { isNull } from 'lodash';
// import { Proskomma } from 'proskomma-cross';
import ProskommaInterface from './ProskommaInterface';
// import Epitelete from 'epitelete';
// import { PipelineHandler } from 'proskomma-json-tools';

class Aligner {
    /**
     *
     * @param {String[]} sourceUsfm - source raw usfm, code lang and abbr
     * @param {String[]} targetUsfm - target raw usfm, code lang and abbr
     * @param {boolean} verbose
     */
    constructor({sourceText=[], targetText=[], verbose=false}) {

        this.proskommaInterface = new ProskommaInterface();
        let bookCodeSrc, docSetIdSrc, bookCodeTrg, docSetIdTrg = "";
        if(!isNull(sourceText[0])) {
            [bookCodeSrc, docSetIdSrc] = this.proskommaInterface.addRawDocument(sourceText[0], sourceText[1], sourceText[2]);
            this.sourceText = sourceText[0];
        } else {
            this.sourceText = "";
        }
        if(!isNull(targetText[0])) {
            [bookCodeTrg, docSetIdTrg] = this.proskommaInterface.addRawDocument(targetText[0], targetText[1], targetText[2]);
            this.targetText = targetText[0];
            if(bookCodeSrc !== "" && bookCodeTrg !== "" && bookCodeSrc != bookCodeTrg) {
                throw new Error("the book code doesn't match. Are you trying to align two different books ?");
            } else {
                this.bookCode = bookCodeSrc;
            }
        } else {
            this.targetText = "";
        }
        
        this.currentChapter = 1;
        this.currentVerse = 1;
        this.currentReference = this.generateReference();
        this.idtexts = [docSetIdSrc, docSetIdTrg];
        this.currentSourceSentence = [];
        this.currentSourceSentenceStr = "";
        this.currentTargetSentence = [];
        this.currentTargetSentenceStr = "";
        this.verbose = verbose;
        this.AlignementJSON=JSON.parse("{}");
        this.AlignementJSON.sourceText = this.currentSourceSentenceStr;
        this.AlignementJSON.targetText = this.currentTargetSentenceStr;
        this.AlignementJSON.alignments = {};
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

    setCurrentChapter(chapterInt) {
        this.currentChapter = chapterInt;
        this.generateReference();
    }

    setCurrentVerse(verseInt) {
        this.currentVerse = verseInt;
        this.generateReference();
    }

    /**
     * change the source chapter/verse to align
     * @param {int} cint chapter
     * @param {int} vint verse
     */
    async setChapterVerse(cint, vint) {
        this.setCurrentChapter(cint);
        this.setCurrentVerse(vint);
        generateReference();

        this.setCurrentSourceSentence(await getVerseFromCV(this.docSetIdSrc, this.bookCode, cint, vint));
        this.setCurrentTargetSentence(await getVerseFromCV(this.docSetIdTrg, this.bookCode, cint, vint));
    }

    loadSourceText()

    /**
     * 
     * @param {string[]|string} sentence the sentence for alignment
     */
    setCurrentSourceSentence(sentence) {
        this.generateReference();
        if(typeof sentence === "object" && !isNull(sentence[0]) && typeof sentence[0] === "string") {
            this.currentSourceSentence = sentence;
        } else if (typeof sentence === "string") {
            this.currentSourceSentence = sentence.trim().split(/\n|[ ,-]/g).filter(element => {
                return element.trim() !== "";
            });
            this.currentSourceSentenceStr = sentence;
        }
        if(!this.AlignementJSON[this.currentReference]) {
            this.generateTemplateJson();
        }
    }

    /**
     * 
     * @param {string[]|string} sentence the sentence for alignment
     */
    setCurrentTargetSentence(sentence) {
        this.generateReference();
        if(typeof sentence === "object" && !isNull(sentence[0]) && typeof sentence[0] === "string") {
            this.currentTargetSentence = sentence;
        } else if (typeof sentence === "string") {
            this.currentTargetSentence = sentence.trim().split(/\n|[ ,-]/g).filter(element => {
                return element.trim() !== "";
            });
            this.currentTargetSentenceStr = sentence;
        }
        if(!this.AlignementJSON[this.currentReference]) {
            this.generateTemplateJson();
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
            if(isNull(this.AlignementJSON[this.currentReference]["alignments"][sWord]["targetWords"][0])) {
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

export default Aligner;