# ALIGNMENTAPI

## QUICK START

```js
const aligner = new Aligner({
  sourceUsfm:null,
  targetUsfm:null,
  verbose:false
});
aligner.setCurrentChapter(1);
aligner.setCurrentVerse(1);
aligner.setCurrentSourceSentence("Παῦλος, δοῦλος Θεοῦ, ἀπόστολος δὲ Ἰησοῦ Χριστοῦ, κατὰ πίστιν ἐκλεκτῶν Θεοῦ, καὶ ἐπίγνωσιν ἀληθείας, τῆς κατ’ εὐσέβειαν");
aligner.setCurrentTargetSentence("Paul, a servant of God and an apostle of Jesus Christ for the faith of the chosen people of God and the knowledge of the truth that agrees with godliness,");

aligner.addAlignment(0, 0); // "Παῦλος" : "Paul"
aligner.addAlignment(1, 1); // "δοῦλος" : "a"
aligner.addAlignment(1, 2); // "δοῦλος" : "a", "servant"
aligner.addAlignment(1, 3); // "δοῦλος" : "a", "servant", "of"
aligner.removeAlignment(1, 3); // "δοῦλος" : "a", "servant"
aligner.addAlignment(2, 3); // "Θεοῦ" : "of"
aligner.addAlignment(2, 4); // "Θεοῦ" : "of", "God"
```

## TO BE DONE

* handling a source usfm and a target usfm as an input
* being able to choose a verse/sentence in the given usfms
* enhance the output JSON (having lemmas and other informations could be great)

1) swapping source texts : **DONE**
2) many to many word alignment : **DONE**
3) modifying existing alignments : *TBD*
4) resetting the alignment : **DONE**
5) how to specify how much of the text is to be aligned (single/multiple verse, ect) : *TBD*
6) other features of the API to showcase : working on a video
7) outputting to uW's format USFM : **DOING** (finalizing the transform USFM+alignment Data => USFM aligned) => using `PipelineHandler` from `proskomma-json-tools` to output a final aligned usfm from the JSON informations *TBD*
8) 3-way alignment (not a priority if it's not included) : *TBD*
9) proskomma-core back end : **DONE**
10) selecting chapter-verses to align through a provided usfm : **DONE**
11) a mechanism to know if the alignment for the selected portion is complete : *TBD*
12) related to the above demonstrate how to calculate the percentage of the book that's been aligned : *TBD*