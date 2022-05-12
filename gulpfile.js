const { stream } = require('browser-sync');

/*переменные для массива объектов с путями*/
let project_folder = "dist";
let source_folder = "#src";

/*file system*/
let fs = require('fs');
// для работы с путями
const path = require('path');

/*
 
 ___  ____ ___ _  _ ____ 
 |__] |__|  |  |__| [__  
 |    |  |  |  |  | ___] 
                         
 
*/

let pathTo = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/js/",
        img: project_folder + "/img/",
        fonts: project_folder + "/fonts/",
        favicons: project_folder + "/favicons/"
    },
    src: {
        pug: source_folder + "/pages/**/*.pug",
        css: source_folder + "/scss/styles.scss",
        js: source_folder + "/pages/**/*.js",
        img: source_folder + "/img/**/*.+(png|jpg|gif|ico|svg|webp)",
        fonts: source_folder + "/fonts/*.{ttf, TTF}",
        favicons: source_folder + "/favicons/**/*.+(png|svg|ico)",
        icons: source_folder + "/icons/**/**/*.svg"
    },
    watch: { //какие файлы слушаем для сихронизации с browsersync
        pug: source_folder + "/**/**/*.pug",
        css: source_folder + "/**/*.+(scss|sass)",
        js: source_folder + "/**/*.js",
        img: source_folder + "/img/**/*.+(png|jpg|gif|ico|svg|webp)",
        icons: source_folder + "/icons/**/**/*.svg"
    },
    clean: "./" + project_folder + "/" //путь для удаления папки dist, чтобы каждый раз перед прогоном бандла функций галпа удалять ненужные файлы
}

//для преттифаера html
var prettyOption = {
    indent_size: 4,
    indent_char: ' ',
    unformatted: ['code', 'em', 'strong', 'span', 'i', 'b', 'br', 'script'],
    content_unformatted: [],
};

/*объявляем зависимости через переменные для дальнейших манипуляций с ними*/
/*
 
 ___  ____ ___  ____ _  _ ___  ____ _  _ ____ _ ____ ____ 
 |  \ |___ |__] |___ |\ | |  \ |___ |\ | |    | |___ [__  
 |__/ |___ |    |___ | \| |__/ |___ | \| |___ | |___ ___] 
                                                          
 
*/

const { src, dest, series, parallel } = require('gulp'),
    gulp = require('gulp'),
    browsersync = require('browser-sync').create(),
    pug = require('gulp-pug'),
    del = require('del'),
    scss = require('gulp-sass'),
    autoprefixer = require('autoprefixer'),
    group_media = require('gulp-group-css-media-queries'),//собирает, группирует и выносит медиазапросы в конец файла
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify-es').default,
    imagemin = require('gulp-imagemin'),//сжатие картинок без потерь
    webp = require('gulp-webp'),
    /*лучше вручную интегрировать webp в разметку и стили*/
    //webp_html = require('gulp-webp-html'),//интеграция сконвертированной пикчи.webp в разметку с фоллбеком для старья
    //webp_css = require('gulp-webpcss'),//интеграция сконвертированной пикчи.webp в стили для background'ов
    svg_sprite = require('gulp-svg-sprite'),
    /*конвертеры шрифтов*/
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    postcss = require('gulp-postcss'),
    cssnano = require('cssnano'),
    prettyHtml = require('gulp-pretty-html'),
    // babel = require('gulp-babel');
    rollup = require('gulp-better-rollup'),
    babel = require('rollup-plugin-babel'),
    resolve = require('rollup-plugin-node-resolve'),
    commonjs = require('rollup-plugin-commonjs'),
    through2 = require('through2'); //для создания встроенных плагинов

/*
 
 ____ _  _ _  _ ____ ___ _ ____ _  _ ____ 
 |___ |  | |\ | |     |  | |  | |\ | [__  
 |    |__| | \| |___  |  | |__| | \| ___] 
                                          
 
*/

function cleanDictionaries() {
    return src('#src/dictionaries/')
        .pipe(through2.obj(function(_, _, cb) {
            const dictionariesDir = '#src/dictionaries/';
            const dictionaries = fs.readdirSync(dictionariesDir).filter(dic => path.extname(dic) === '.pug');

            if (dictionaries.length > 0) {
                dictionaries.forEach(dic => fs.writeFileSync(`${dictionariesDir}/${path.basename(dic)}`, ''))
            }

            cb();
        })).on('end', () => console.log('dictionaries has been cleaned'))
}

function collectData() {
    // const sectionsDir = '#src/sections/';

    const locales = ['ru', 'en', 'vn', 'tr'];

    return src('#src/sections/**/data/')
        .pipe(through2.obj(function(dataFile, _, cb) {
            for (let locale of locales) {
                let localeRegExp = new RegExp(locale);
                let fileName = path.basename(`#src/sections/**/data/${dataFile}.pug`);

                console.log(fileName);

                if (fileName.match(localeRegExp)) {
                    let filePath = `include ../sections/${section}/data/${fileName}.pug\n`;

                    fs.appendFileSync(
                        `#src/dictionaries/dictionary.${locale}.pug`, 
                        filePath
                    )
                }
            }
            cb();
        })).on('end', () => console.log('data has been included'))
}

function collectDatas(cb) {
    const sectionsDir = '#src/sections/';
    const dictionariesDir = '#src/dictionaries/';

    const locales = ['ru', 'en', 'vn', 'tr'];

    const dictionaries = fs.readdirSync(dictionariesDir);

    //чистка содержимого всех словарей чтобы избежать копипасты при каждом новом создании дата-файла в секции.
    //содержимое словаря будет воссоздаваться заново при каждом новом создании data-(locale).pug включая и этот дата-файл. надо доработать или вообще переделать
    dictionaries.forEach(dictionary => {
        if (path.extname(dictionary) === '.pug') {
            fs.writeFileSync(`${dictionariesDir}/${path.basename(dictionary)}`, '');
        }
    })

    const sections = fs.readdirSync(sectionsDir);

    sections.forEach(section => {
        const sectionData = path.join(sectionsDir, section, '/data/');

        if (!fs.lstatSync(sectionData).isDirectory()) return

        const dataFiles = fs.readdirSync(sectionData).filter(file => path.extname(file) === '.pug');

        for (let file of dataFiles) {
            for (let locale of locales) {
                let localeRegExp = new RegExp(locale);

                if (file.match(localeRegExp)) {
                    let filePath = `include ../sections/${section}/data/${file}\n`;

                    fs.appendFileSync(
                        `#src/dictionaries/dictionary.${locale}.pug`, 
                        filePath
                    )
                }
            }
        }
    })

    return cb();
}

function copyFavicons() {
    return src(pathTo.src.favicons)
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 2 // от 0 до 7
            })
        )
        .pipe(dest(pathTo.build.favicons))
}

/*
 
 ___  _  _ ____ 
 |__] |  | | __ 
 |    |__| |__] 
                
 
*/

function pug2html() {
    return src([pathTo.src.pug, "!#src/pages/**/connectors/*.connector.pug"])
        .pipe(pug())
        .pipe(prettyHtml(prettyOption))
        .pipe(rename({ dirname: "" }))
        .pipe(dest(pathTo.build.html))
        .pipe(browsersync.stream())
}

/*
 
 ____ ____ ____ 
 |    [__  [__  
 |___ ___] ___] 
                
 
*/

function css() {
    return src(pathTo.src.css)
        .pipe(
            scss({
                outputStyle: 'expanded'
            })
        )
        .pipe(
            group_media()
        )
        // .pipe(webp_css())
        .pipe(dest(pathTo.build.css))//выхлоп несжатого css без чистки и оптимизации медиазапросов
        .pipe(postcss([
            autoprefixer({
                cascade: 'true'
            }),
            cssnano({
                preset: ['advanced', {
                    discardComments: { removeAll: true }
                }]
            })
        ]))
        .pipe(
            rename({
                extname: ".min.css",
            })
        )
        .pipe(dest(pathTo.build.css))//выхлоп сжатого на проду
        .pipe(browsersync.stream())
}

/*
 
  _ ____ _  _ ____ ____ ____ ____ _ ___  ___ 
  | |__| |  | |__| [__  |    |__/ | |__]  |  
 _| |  |  \/  |  | ___] |___ |  \ | |     |  
                                             
 
*/

function js() {
    return src(pathTo.src.js)
        .pipe(rollup({ plugins: [commonjs(), resolve(), babel({ presets: ['@babel/env'] })] },
            {
                format: "iife"
            }))
        .pipe(rename({ dirname: "" }))
        .pipe(dest(pathTo.build.js))
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: ".min.js",
            })
        )
        .pipe(rename({ dirname: "" }))
        .pipe(dest(pathTo.build.js))
        .pipe(browsersync.stream())
}

/*
 
 _ _  _ ____ ____ ____ ____ 
 | |\/| |__| | __ |___ [__  
 | |  | |  | |__] |___ ___] 
                            
 
*/

function images() {
    return src(pathTo.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(pathTo.build.img))
        .pipe(src(pathTo.src.img))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3 // от 0 до 7
            })
        )
        .pipe(dest(pathTo.build.img))
        .pipe(browsersync.stream())
}

/*
 
 ____ ____ _  _ ___    ____ ____ _  _ _  _ ____ ____ ___ ____ ____ 
 |___ |  | |\ |  |     |    |  | |\ | |  | |___ |__/  |  |___ |__/ 
 |    |__| | \|  |     |___ |__| | \|  \/  |___ |  \  |  |___ |  \ 
                                                                   
 
*/

function fonts(params) {
    src(pathTo.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(pathTo.build.fonts));
    return src(pathTo.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(pathTo.build.fonts));
}

/*
 
 ____ ___  ____ _ ___ ____    _  _ ____ _  _ ____ ____ 
 [__  |__] |__/ |  |  |___    |\/| |__| |_/  |___ |__/ 
 ___] |    |  \ |  |  |___    |  | |  | | \_ |___ |  \ 
                                                       
 
*/

function makeSprite() {
    return gulp.src(pathTo.src.icons)
        .pipe(svg_sprite({
            mode: {
                stack: {
                    sprite: '../icons/sprite.svg', //имя файла спрайта
                    example: false
                }
            }
        }))
        .pipe(dest(pathTo.build.img))
}

/*
 
 ____ _    ____ ____ _  _ 
 |    |    |___ |__| |\ | 
 |___ |___ |___ |  | | \| 
                          
 
*/

//функция для удаления папки dist целиком перед серией выполняемых фукций
function clean(params) {
    return del(pathTo.clean);
}

/*
 
 ___  ____ ____ _  _ ____ _  _    _    _ ____ ___ ____ _  _ ____ ____ 
 |  \ |__| |___ |\/| |  | |\ |    |    | [__   |  |___ |\ | |___ |__/ 
 |__/ |  | |___ |  | |__| | \|    |___ | ___]  |  |___ | \| |___ |  \ 
                                                                      
 
*/

const DAEMON = (cb) => {
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/"
        },
        notify: false,
        open: true,
        cors: true,
        startPath: '/index.html'
    });

    gulp.watch([pathTo.watch.img], series(images)).on('change', browsersync.reload);
    gulp.watch([pathTo.watch.icons], series(makeSprite)).on('change', browsersync.reload);
    gulp.watch([pathTo.watch.css], series(css)).on('change', browsersync.reload);
    gulp.watch([pathTo.watch.js], series(js)).on('change', browsersync.reload);  
    gulp.watch([pathTo.watch.pug], series(collectData, pug2html)).on('change', browsersync.reload);

    return cb();
}

/*закрываю в параллель для одновременного выполнения функции обработки ключевых файлов*/
let dev = gulp.series(
    clean,
    cleanDictionaries,
    collectData,
    gulp.parallel(
        js,
        css,
        pug2html,
        images,
        copyFavicons,
        fonts,
        makeSprite
    ),
    DAEMON
);

exports.dev = dev;
exports.default = dev;