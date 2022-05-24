const fs = require('fs'),
    path = require('path'),
    // through2 = require('through2'),
    clc = require('cli-color');

const cliPalette = {
    narrator: clc.magentaBright.bgBlack,
    info: clc.black,
    infoBright: clc.blackBright,
    warning: clc.yellow,
    warningBright: clc.yellowBright,
    error: clc.red
}

class Servant {
    constructor() { }

    _log(message) {
        console.log(cliPalette.narrator('[Servant]') + ': ' + message)
    }

    /**
     *  Показывает сообщение в терминале. 
     * @param { string } message - сообщение
     * @param { 'info' | 'warning' | 'error' } messageType - тип сообщений (необязательный параметр, по умолчанию info)
     */
    _inform(message, messageType = 'info') {
        if (messageType === 'info') {
            this._log(cliPalette.infoBright(message))
        }
        if (messageType === 'warning') {
            this._log(cliPalette.warning(message))
        }
        if (messageType === 'error') {
            this._log(cliPalette.error(message))
        }
    }

     /**
     *  Удаляет неактуальные импорты/инклюды в файле (если импортируемые файлы не существуют или удалены). 
     * @param { path } filePath - путь до проверяемого файла
     */
    _cleanIrrelevantImports(filePath) {
        let fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'});
        let fileContentArr = fileContent.split('\n');

        fileContentArr.filter(str => str.match(/\w/)).forEach(str => {
            const tempStr = str.trim();
            const relativePathFromString = tempStr.split('..').pop().trim();
            const absolutePathFromString = path.join('#src', path.normalize(relativePathFromString));

            if (!fs.existsSync(absolutePathFromString)) {
                
                this._inform(`"${relativePathFromString}" does not exist`, 'warning');
                fs.writeFileSync(filePath, fileContentArr.filter(str => str.trim() !== tempStr).join('\n'));
                this._inform(`unused "${tempStr}" has been successfully removed from "${filePath}"`);
            }
        })
    }

    /**
     *  Проверяет актуальность подключенных data-файлов в словаре, удаляет лишние инклюды(если data-файл был удален) и добавляет нужные(если data-файл создан, но еще не подключен к соответствующему для него словарю). 
     * @param { path } dataFilePath - путь до data-файла
     * @param { path } dictionariesDir - директория со словарями (e.g. #src/dictionaries/)
     * @param { object } locales - массив с локалями для сортировки data-файлов по словарям
     */
    updateDictionary(dataFilePath, dictionariesDir, locales) {
        const dataFilePathArr = process.platform === 'win32' ? dataFilePath.split('\\') : dataFilePath.split('/');
        const currentSection = dataFilePathArr.splice(dataFilePathArr.indexOf('sections') + 1, 1);
        const dataFileName = path.basename(dataFilePath);

        for (let locale of locales) {
            const localeRegExp = new RegExp(locale);

            if (dataFileName.match(localeRegExp)) {
                const dataFileInclude = `include ../sections/${currentSection}/data/${dataFileName}`;
                const relevantDictionary = path.join(dictionariesDir, `dictionary.${locale}.pug`);
                const dictionaryContent = fs.readFileSync(relevantDictionary, { encoding: 'utf-8' });

                this._cleanIrrelevantImports(relevantDictionary);

                if (!dictionaryContent.includes(dataFileInclude)) {
                    fs.appendFile(relevantDictionary, dataFileInclude+'\n', (err) => {
                        if (err) throw err;
                        this._inform(`missing "${path.join(currentSection.toString(), 'data', dataFileName)}" has been successfuly added into "${relevantDictionary}"`);
                    });
                }
            }
        }
    }
}


module.exports.Servant = Servant;
