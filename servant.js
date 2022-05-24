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
    cleanIrrelevantImports(filePath) {
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
     *  Добавляет data-файл к соответствующему для него словарю (если data-файл создан, но еще не подключен). 
     * @param { path } dictionaryPath - путь до словаря
     */
    updateDictionary(dictionaryPath) {
        const sectionsDir = '#src/sections/';
        const sections = fs.readdirSync(sectionsDir);
        const dictionaryLocale = dictionaryPath.toString().split('.').splice(1, 1);
        const dictionaryContent = fs.readFileSync(dictionaryPath, { encoding: 'utf-8'});

        sections.forEach(section => {
            const relevantDataFile = path.join(sectionsDir, section, '/data/', `data-${dictionaryLocale}.pug`);
            const includeStr = `include ../sections/${section}/data/data-${dictionaryLocale}.pug`;

            if (fs.existsSync(relevantDataFile) && !dictionaryContent.includes(includeStr)) {
                fs.appendFile(dictionaryPath, includeStr+'\n', (err) => {
                    if (err) throw err;
                    this._inform(`missing ${includeStr} has been successfuly added into ${dictionaryPath}`);
                });
            }
        })
    }
}


module.exports.Servant = Servant;
