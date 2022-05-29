const fs = require('fs'),
    path = require('path'),
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
     * Показывает сообщение в терминале. 
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
     * Удаляет неактуальные импорты/инклюды в файле (если импортируемые файлы не существуют или удалены). 
     * @param { path } filePath - путь до проверяемого файла
     * @param { 'dictionary' | 'componentStyle' | 'componentTemplate' } fileType - тип файла
     */
    cleanUnusedImports(filePath, fileType) {
        let fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'});
        let fileContentArr = fileContent.split('\n');
        let importCommand = '@import';

        if (fileType === 'dictionary' || fileType === 'componentTemplate') importCommand = 'include';

        fileContentArr.filter(str => str.match(/\w/)).forEach(str => {
            const tempStr = str.trim();

            if (tempStr.includes(importCommand)) {
                if (fileType === 'dictionary' || fileType === 'componentStyle') {
                    const relativePathFromStr = tempStr.split('..').pop().trim();
                    let absolutePathFromStr;
                    
                    if (fileType === 'dictionary') {
                        absolutePathFromStr = path.join('#src', path.normalize(relativePathFromStr));
                    } else {
                        absolutePathFromStr = path.join('#src', path.normalize(relativePathFromStr.split('').filter(i => !i.match(/'|;|"/)).join('')));
                    }
        
                    if (!fs.existsSync(absolutePathFromStr)) {
                        this._inform(`"${relativePathFromStr}" does not exist`, 'warning');
                        fs.writeFileSync(filePath, fileContentArr.filter(str => str.trim() !== tempStr).join('\n'));
                        this._inform(`unused "${tempStr}" has been successfully removed from "${filePath}"`);
                    }
                }
    
                if (fileType === 'componentTemplate') {
                    let includeModuleName = str.split('/').slice(-1).toString().split('.')[0];
    
                    if (!fileContent.includes(`+${includeModuleName}`+'(')) {
                        fileContentArr.splice(fileContentArr.indexOf(str), 1);
    
                        fs.writeFile(filePath, fileContentArr.join('\n'), (err) => {
                            if (err) {
                                throw err;
                            } else {
                                this._inform(`unused include has been removed in "${filePath}"`)
                            }
                        });
                    }
                }
            }
        })
    }

    /**
     * Добавляет data-файл к соответствующему для него словарю (если data-файл создан, но еще не подключен). 
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

    /**
     * Подключает pug и scss файлы компонентов "гостей" к компоненту "хозяину". 
     * @param { path } filePath - путь до pug компонента "хозяина"
     * @param { 'modules' | 'sections' } componentType - тип подключаемых компонентов
     */
    connectComponents(filePath, componentType) {
        const componentPath = filePath.split('.').shift();
        
        let templateContent = fs.readFileSync(componentPath+'.pug', {
            encoding: 'utf-8'
        });
        let styleContent = fs.readFileSync(componentPath+'.scss', {
            encoding: 'utf-8'
        });

        const mixinRegEx = /\+[A-Za-z-]+\(/;

        const fileComponents = templateContent.split(' ')
            .filter(item => item.match(mixinRegEx))
            .sort()
            .filter((_, i, arr) => arr[i] !== arr[i + 1]);
        
        if (fileComponents.length) {
            const componentsNames = fileComponents.map((item) => item.slice(1, item.indexOf('(')));
            let includes = '';
            let imports = '';

            componentsNames.forEach(component => {
                const includeCheck = `include ../../${componentType}/${component}/${component}.pug`;
                const importCheck = `@import '../../${componentType}/${component}/${component}.scss';`;
                
                if (!templateContent.includes(includeCheck)) {
                    includes += `${includeCheck}\n`;
                    imports += `${importCheck}\n`;
                }
            });

            componentsNames.forEach(component => {
                const includeCheck = `include ../../${componentType}/${component}/${component}.pug`;
                const importCheck = `@import '../../${componentType}/${component}/${component}.scss';`;

                if (!templateContent.includes(includeCheck) && !styleContent.includes(importCheck)) {
                    fs.writeFileSync(componentPath+'.pug', includes+templateContent);
                    fs.writeFileSync(componentPath+'.scss', imports+styleContent);
                    this._inform(`"${component}" ${componentType.split('').slice(0, -1).join('')} has been successfully included into "${filePath}"`);
                }
            })
        }
    }

    /**
     * Задает общий шаблон для всех страниц. 
     * @param { path } filePath - путь до страницы
     * @param { string } layoutType - тип подключаемых шаблонов
     */
    setLayoutForPages(filePath, layoutType) {
        let pageContent = fs.readFileSync(filePath, {
            encoding: 'utf-8'
        });

        let pageContentArr = pageContent.split('\n');
        let layoutExtendStr = `extends ../../layouts/layout-${layoutType}.pug`;

        let layoutRelativePath = layoutExtendStr.split('..').pop().trim();
        let layoutAbsolutePath = path.join('#src', path.normalize(layoutRelativePath));

        if (!fs.existsSync(layoutAbsolutePath)) {
            this._inform(layoutAbsolutePath+' does not exist', 'error');
        } else {
            pageContentArr.forEach(str => {
                if (str.match('extends|layouts/')) {
                    fs.writeFileSync(filePath ,layoutExtendStr+'\n'+pageContentArr.filter(str => !str.match('extends|layouts/')).join('\n'));
                }
            })
        }
    }
}


module.exports.Servant = Servant;