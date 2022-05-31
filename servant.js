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
     * Удаляет ВСЕ импорты/инклюды в файле (для дебага/теста). 
     * @param { path } filePath - путь до проверяемого файла
     * @param { 'dictionary' | 'componentStyle' | 'componentTemplate' } fileType - тип файла
     */
    cleanAllImports(filePath, fileType) {
        let fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'});
        let fileContentArr = fileContent.split('\n');
        let importCommand = '@import';

        if (fileType === 'dictionary' || fileType === 'componentTemplate') importCommand = 'include';

        fileContentArr.filter(str => str.match(/\w/)).forEach(str => {
            const tempStr = str.trim();

            if (tempStr.includes(importCommand)) {
                if (fileType === 'dictionary' || fileType === 'componentStyle') {
                    fileContentArr.splice(fileContentArr.indexOf(str), 1);
                    fs.writeFileSync(filePath, fileContentArr.join('\n'));
                    this._inform(`"${tempStr}" has been successfully removed from "${filePath}"`);
                }
    
                if (fileType === 'componentTemplate') {
                    let includeModuleName = str.split('/').slice(-1).toString().split('.')[0];
    
                    if (fileContent.includes(`+${includeModuleName}`+'(')) {
                        fileContentArr.splice(fileContentArr.indexOf(str), 1);

                        fs.writeFileSync(filePath, fileContentArr.join('\n'));
                        this._inform(`"${includeModuleName}" include has been removed from "${filePath}"`)
                    }
                }
            }
        })
    }

    /**
     * Удаляет импорты/инклюды несуществующих/удаленных компонентов-"гостей" в компоненте-"хозяине". 
     * @param { path } filePath - путь до проверяемого компонента-"хозяина"
     * @param { 'dictionary' | 'componentTemplate' | 'componentStyle' } fileType - тип компонента-"хозяина"
     */
    cleanDeadImports(filePath, fileType) {
        let fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
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

                        fileContentArr.splice(fileContentArr.indexOf(str), 1);
                        fs.writeFileSync(filePath, fileContentArr.join('\n'));

                        this._inform(`dead "${tempStr}" has been successfully removed from "${filePath}"`);
                    }
                }

                if (fileType === 'componentTemplate') {
                    let includeModuleName = str.split('/').slice(-1).toString().split('.')[0];

                    if (!fileContent.includes(`+${includeModuleName}` + '(')) {
                        fileContentArr.splice(fileContentArr.indexOf(str), 1);

                        fs.writeFile(filePath, fileContentArr.join('\n'), (err) => {
                            if (err) {
                                throw err;
                            } else {
                                this._inform(`dead include has been removed from "${filePath}"`)
                            }
                        });
                    }
                }
            }
        })
    }

    /**
     * Удаляет неактуальные импорты/инклюды в компоненте-"хозяине" (если компонент-"гость" существует, но не используется в компоненте-"хозяине"). 
     * @param { path } filePath - путь до проверяемого компонента-"хозяина"
     */
    cleanUnusedImports(filePath) {
        const hostComponentPath = filePath.split('.').shift();
        
        let hostTemplateContent = fs.readFileSync(hostComponentPath+'.pug', {
            encoding: 'utf-8'
        });
        let hostStyleContent = fs.readFileSync(hostComponentPath+'.scss', {
            encoding: 'utf-8'
        });

        let hostTemplateContentArr = hostTemplateContent.split('\n');
        let hostStyleContentArr = hostStyleContent.split('\n');

        hostTemplateContentArr.forEach(str => {
            if (str.match('include ../')) {
                const importedGuestPath = path.dirname(str.split(' ').pop());
                const importedGuestName = str.split('..').pop().split('.').shift().split('/').pop();
                let isImportedGuestApplied = false;

                hostTemplateContentArr.forEach(str => {
                    if (str.includes(`+${importedGuestName}(`)) isImportedGuestApplied = true;
                })

                if (!isImportedGuestApplied) {
                    fs.writeFileSync(hostComponentPath+'.pug', hostTemplateContentArr.filter(i => i !== str).join('\n'));                    
                    fs.writeFileSync(hostComponentPath+'.scss', hostStyleContentArr.filter(i => i.trim() !== `@import '${importedGuestPath}/${importedGuestName}.scss';`).join('\n'));

                    this._inform(`unused "${importedGuestName}" imports has been successfully removed from "${filePath}"`);
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
     * @param { string } layoutType - тип подключаемого шаблона(если подключаем компоненты к странице)
     */
    connectComponents(filePath, componentType, layoutType) {
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

            if (includes.length !== 0 || imports.length !== 0) {
                let pageTemplateContent;

                if (componentType === 'sections') {
                    pageTemplateContent = `extends ../../layouts/layout-${layoutType}.pug\n` + includes + templateContent.split('\n').slice(1).join('\n');
                } else {
                    pageTemplateContent = includes + templateContent;
                }

                fs.writeFileSync(componentPath+'.pug', pageTemplateContent);
                fs.writeFileSync(componentPath+'.scss', imports+styleContent);
                this._inform(`${componentType.split('').slice(0, -1).join('')} has been successfully included into "${filePath}"`);
            }
        }
    }

    /**
     * Задает общий шаблон для всех страниц. 
     * @param { path } filePath - путь до страницы
     * @param { string } layoutType - тип подключаемого шаблона для всех страниц
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
            if (!pageContent.includes(layoutExtendStr)) {
                pageContentArr.forEach(str => {
                    if (str.match('extends ../')) {
                        fs.writeFileSync(filePath ,layoutExtendStr+'\n'+pageContentArr.filter(str => !str.match('extends ../')).join('\n'));
                    }
                })
            }
        }
    }
}


module.exports.Servant = Servant;