const fse = require('fs-extra');
const path = require('path');

module.exports.saveFile = async function saveFile(file, rpath="./output.json") {
    try {
        if(typeof file === "string") {
            let thepath = rpath;
            await fse.outputFile(path.resolve(thepath), file);
        } else {
            await fse.outputJson(path.resolve(rpath), file);
        }
    } catch (err) {
        throw new Error("Failed to save the file", err)
    }
}

module.exports.handleOccurences = function handleOccurences(arrayWords) {
    let len = arrayWords.length;
    let occurences = new Map();
    let posOccurence = [...arrayWords];
    for(let i = 0; i < len; i++) {
        if(occurences.has(arrayWords[i]) && arrayWords[i] !== "") {
            occurences.set(arrayWords[i], occurences.get(arrayWords[i]) + 1);
        } else {
            occurences.set(arrayWords[i], 1);
        }
        posOccurence[i] = occurences.get(arrayWords[i]);
    };
    return [occurences, posOccurence];
}