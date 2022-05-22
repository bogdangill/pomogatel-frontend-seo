const fs = require('fs'),
    path = require('path'),
    // through2 = require('through2'),
    clc = require('cli-color');

const cliPalette = {
    narrator: clc.magentaBright.bgBlack,
    success: clc.green,
    successBright: clc.greenBright,
    warning: clc.yellow,
    warningBright: clc.yellowBright,
    error: clc.red
}

class Servant {
    constructor() {}

    _log(message) {
        return console.log(cliPalette.narrator('[Servant]')+': '+message)
    }

    _inform(messageType, message) {
        if (messageType === 'success') {
            return this._log(cliPalette.success(message))
        }
        if (messageType === 'warning') {
            return this._log(cliPalette.warning(message))
        }
        if (messageType === 'error') {
            return this._log(cliPalette.error(message))
        }
    }

    readFilePath(file) {
        return this._inform('warning', file.path);
    }

    cleanFile(file) {
        fs.writeFileSync(file.path, '');
        this._inform('success', `${path.basename(file.path)} has been cleaned`);
    }

    updateDictionary(dataFilePath, dictionariesDir, locales) {
        const dataFilePathArr = dataFilePath.split('/');
        const currentSection = dataFilePathArr.splice(dataFilePathArr.indexOf('sections') + 1, 1);
        const dataFileName = path.basename(dataFilePath);

        for (let locale of locales) {
            const localeRegExp = new RegExp(locale);

            if (dataFileName.match(localeRegExp)) {
                const dataFileInclude = `include ../sections/${currentSection}/data/${dataFileName}\n`;
                const relevantDictionary = path.join(dictionariesDir, `dictionary.${locale}.pug`);
                const dictionaryContent = fs.readFileSync(relevantDictionary, {encoding: 'utf-8'});

                if (!dictionaryContent.includes(dataFileInclude)) {
                    fs.appendFileSync(relevantDictionary, dataFileInclude);

                    this._inform('success','missing '+cliPalette.successBright(path.join(currentSection.toString(), 'data', dataFileName))+' has been successfuly added into '+cliPalette.successBright(relevantDictionary));
                }

                // fs.appendFileSync(relevantDictionary, dataFileInclude);
            }
        }
    }
}


module.exports.Servant = Servant;
