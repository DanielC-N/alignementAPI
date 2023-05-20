import {PerfRenderFromJson, transforms, mergeActions} from 'proskomma-json-tools';
import utils from '../../utils/utils';

const generateHebrewReportActions = {
    startDocument: [
        {
            description: "Set up state variables and output",
            test: () => true,
            action: ({ workspace, output }) => {
                workspace.chapter = 1;
                workspace.verse = 1;
                workspace.wordPos = 1;
                workspace.infosHebrewWords = [];
                workspace.hebrewWordsInVerse = [];
                workspace.lemmaInVerse = [];
                workspace.hebrewWordInfos = {};
                workspace.hebrewText = "";
                workspace.hebrewTextSplitted = "";
                workspace.inwrap = true;
                output.report = [];
            }
        },
    ],
    startWrapper: [
        {
            description: "Getting the hebrew content on wrapper event",
            test: ({ context }) => context.sequences[0].element.subType === "usfm:w",
            action: ({ context, workspace }) => {
                workspace.inwrap = true;
                let elem = context.sequences[0].element;
                let lemma = elem.atts.lemma[0];
                let morph = elem.atts["x-morph"];
                let strong = elem.atts.strong[0].replace(/^\w:/,"");
                workspace.hebrewWordInfos = {
                    "chapter": workspace.chapter,
                    "verse": workspace.verse,
                    "wordPos": workspace.wordPos,
                    "strong" : strong,
                    "lemma" : lemma,
                    "morph" : morph,
                    "word" : "",
                    "occurence": "",
                    "occurences": "",
                    "occurenceLemma": "",
                    "occurencesLemma": ""
                };
                workspace.lemmaInVerse.push(lemma);
            },
        },
    ],
    endWrapper: [
        {
            description: "Getting the french content on wrapper event",
            test: ({ context }) => context.sequences[0].element.subType === "usfm:w",
            action: ({ workspace }) => {
                workspace.wordPos += workspace.hebrewTextSplitted.length;
                workspace.inwrap = false;
                // workspace.hebrewWordInfos["word"] = workspace.hebrewText.at(-1);
                workspace.hebrewWordInfos["word"] = workspace.hebrewText;
                workspace.infosHebrewWords.push(workspace.hebrewWordInfos);
                workspace.hebrewWordsInVerse.push(workspace.hebrewText);
                workspace.hebrewWordInfos = {};
            }
        }
    ],
    mark: [
        {
            description: "Ignore mark events, except for chapter and verses",
            test: ({context}) => {
                return ["chapter", "verses"].includes(context.sequences[0].element.subType);
            },
            action: ({ context, workspace, output }) => {
                const element = context.sequences[0].element;
                if (element.subType === "chapter") {
                    if(element.atts["number"] > 1) {
                        let occurences = null;
                        let posOccurence = null;
                        let occs = null
                        let i = 0;
                        if(workspace.hebrewWordsInVerse[0] !== undefined) {
                            [occurences, posOccurence] = utils.handleOccurences(workspace.hebrewWordsInVerse);
                            for(i = 0; i < workspace.hebrewWordsInVerse.length; i++) {
                                occs = occurences.get(workspace.hebrewWordsInVerse[i]);
                                workspace.infosHebrewWords[i]["occurence"] = posOccurence[i];
                                workspace.infosHebrewWords[i]["occurences"] = occs;
                            }
                        }
                        if(workspace.lemmaInVerse[0] !== undefined) {
                            [occurences, posOccurence] = utils.handleOccurences(workspace.lemmaInVerse);
                            for(i = 0; i < workspace.lemmaInVerse.length; i++) {
                                occs = occurences.get(workspace.lemmaInVerse[i]);
                                workspace.infosHebrewWords[i]["occurenceLemma"] = posOccurence[i];
                                workspace.infosHebrewWords[i]["occurencesLemma"] = occs;
                            }
                            output.report[workspace.chapter][workspace.verse] = [null, ...workspace.infosHebrewWords];
                            workspace.infosHebrewWords = [];
                            workspace.hebrewWordsInVerse = [];
                            workspace.lemmaInVerse = [];
                            workspace.frenchWordsInVerse = [];
                            workspace.wordPos = 1;
                            workspace.hebrewTextPosition = 1;
                        }
                    }
                    workspace.chapter = element.atts["number"];
                    workspace.verse = 1;
                    output.report[workspace.chapter] = [];
                } else if (element.subType === "verses") {
                    let occurences = null;
                    let posOccurence = null;
                    let occs = null
                    let i = 0;
                    if(workspace.hebrewWordsInVerse[0] !== undefined) {
                        [occurences, posOccurence] = utils.handleOccurences(workspace.hebrewWordsInVerse);
                        for(i = 0; i < workspace.hebrewWordsInVerse.length; i++) {
                            occs = occurences.get(workspace.hebrewWordsInVerse[i]);
                            workspace.infosHebrewWords[i]["occurence"] = posOccurence[i];
                            workspace.infosHebrewWords[i]["occurences"] = occs;
                        }
                    }
                    if(workspace.lemmaInVerse[0] !== undefined) {
                        [occurences, posOccurence] = utils.handleOccurences(workspace.lemmaInVerse);
                        for(i = 0; i < workspace.lemmaInVerse.length; i++) {
                            occs = occurences.get(workspace.lemmaInVerse[i]);
                            workspace.infosHebrewWords[i]["occurenceLemma"] = posOccurence[i];
                            workspace.infosHebrewWords[i]["occurencesLemma"] = occs;
                        }
                        output.report[workspace.chapter][workspace.verse] = [null, ...workspace.infosHebrewWords];
                        workspace.infosHebrewWords = [];
                        workspace.hebrewWordsInVerse = [];
                        workspace.lemmaInVerse = [];
                        workspace.frenchWordsInVerse = [];
                        workspace.wordPos = 1;
                        workspace.hebrewTextPosition = 1;
                        workspace.verse = element.atts["number"];
                    }
                }
            }
        },
    ],
    text: [
        {
            description: "Process ONLY hebrew texts events",
            test: () => true,
            action: ({context, workspace}) => {
                if(workspace.inwrap) {
                    workspace.hebrewText = context.sequences[0].element.text;
                    workspace.hebrewTextSplitted = workspace.hebrewText.split(/\u2060/gu);
                    if(workspace.hebrewTextSplitted.length > 1) {
                        workspace.hebrewWordInfos["wordPos"] = workspace.wordPos + workspace.hebrewTextSplitted.length-1;
                    }
                }
            }
        }
    ],
    endDocument: [
        {
            description: "Build output",
            test: () => true,
            action: ({workspace, output}) => {
                if(workspace.infosHebrewWords[0]) {
                    let occurences = null;
                    let posOccurence = null;
                    let occs = null;
                    let i = 0;
                    if(workspace.hebrewWordsInVerse[0] !== undefined && workspace.verse !== 0) {
                        [occurences, posOccurence] = utils.handleOccurences(workspace.hebrewWordsInVerse);
                        for(i = 0; i < workspace.hebrewWordsInVerse.length; i++) {
                            occs = occurences.get(workspace.hebrewWordsInVerse[i]);
                            workspace.infosHebrewWords[i]["occurence"] = posOccurence[i];
                            workspace.infosHebrewWords[i]["occurences"] = occs;
                        }
                    }
                    if(workspace.lemmaInVerse[0] !== undefined && workspace.verse !== 0) {
                        [occurences, posOccurence] = utils.handleOccurences(workspace.lemmaInVerse);
                        for(i = 0; i < workspace.lemmaInVerse.length; i++) {
                            occs = occurences.get(workspace.lemmaInVerse[i]);
                            workspace.infosHebrewWords[i]["occurenceLemma"] = posOccurence[i];
                            workspace.infosHebrewWords[i]["occurencesLemma"] = occs;
                        }
                    }
                    if(workspace.verse !== 0) output.report[workspace.chapter][workspace.verse] = [null, ...workspace.infosHebrewWords];
                }
            }
        },
    ],
};

const makeReportHebrew = function ({perf}) {
    const cl = new PerfRenderFromJson(
        {
            srcJson: perf,
            actions: generateHebrewReportActions
        }
    );
    const output = {};
    cl.renderDocument({docId: "", config: {}, output});
    return {report: output.report};
}

const parseHebrewUsfm = {
    name: "parseHebrewUsfm",
    type: "Transform",
    description: "Generate report from hebrew perf informations",
    inputs: [
        {
            name: "perf",
            type: "json",
            source: ""
        }
    ],
    outputs: [
        {
            name: "report",
            type: "json"
        }
    ],
    code: makeReportHebrew
}

export default parseHebrewUsfm;
