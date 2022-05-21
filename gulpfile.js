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

/*==========================================================================
-------- Clean dictionaries for including up-to-date data files ------------
==========================================================================*/

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

/*==========================================================================
------- Collect data files in sections & include into dictionaries ---------
==========================================================================*/

function collectData(cb) {
    const sectionsDir = '#src/sections/';

    const locales = ['ru', 'en', 'vn', 'tr'];

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

function connectComponents() {
    return src(['#src/sections/**/*.pug', '!#src/sections/**/data/*.pug'])
        .pipe(through2.obj((chunk, enc, cb) => {

            const chunkContent = fs.readFileSync(chunk.path, {
                encoding: 'utf-8'
            });

            const mixinRegEx = /\+\w+\(/;

            const chunkModules = chunkContent.split(' ')
                .filter(item => item.match(mixinRegEx))
                .sort()
                .filter((_, i, arr) => arr[i] !== arr[i + 1]);
            
            if (chunkModules.length) {
                const moduleNames = chunkModules.map((item) => item.slice(1, item.indexOf('(')));
                let includes = '';

                moduleNames.forEach(module => {
                    let includeCheck = `include ../../modules/${module}/${module}.pug`;
                    
                    if (!chunkContent.includes(includeCheck)) {
                        includes += `include ../../modules/${module}/${module}.pug\n`;
                    }
                });

                moduleNames.forEach(module => {
                    let includeCheck = `include ../../modules/${module}/${module}.pug`;

                    if (!chunkContent.includes(includeCheck)) {
                        fs.writeFileSync(chunk.path, includes+chunkContent);
                    }
                })
            }
            
            cb(null, chunk)
        }))
}

/*=======================================================
------ Copy & optimize favicons into dist folder --------
========================================================*/

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

/*============================================================
------- Transpile pug templates into prettified HTML ---------
============================================================*/

function pug2html() {
    return src([pathTo.src.pug, "!#src/pages/**/connectors/*.connector.pug"])
        .pipe(pug())
        .pipe(prettyHtml(prettyOption))
        .pipe(rename({ dirname: "" }))
        .pipe(dest(pathTo.build.html))
        .pipe(browsersync.stream())
}

/*=====================================================================================
------- Group @media, add prefixes, optimize, transpile SCSS and bundle to CSS --------
=====================================================================================*/

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

/*============================================================
------- Minify, transpile to ES5 & bundle JavaScript ---------
============================================================*/

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

/*===================================
--------- Optimize images -----------
====================================*/

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

/*===================================
---------- Convert fonts ------------
====================================*/

function fonts(params) {
    src(pathTo.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(pathTo.build.fonts));
    return src(pathTo.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(pathTo.build.fonts));
}

/*===================================
--------- Make svg sprite -----------
====================================*/

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

/*===================================
-------- Clean dist folder ----------
====================================*/

//функция для удаления папки dist целиком перед серией выполняемых фукций
function clean(params) {
    return del(pathTo.clean);
}

/*===================================
--------- Local Web Server ----------
====================================*/

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
    gulp.watch(['#src/sections/**/data/*.pug'], series(cleanDictionaries, collectData));
    gulp.watch([pathTo.watch.pug], series(connectComponents, pug2html)).on('change', browsersync.reload);

    return cb();
}

/*закрываю в параллель для одновременного выполнения функции обработки ключевых файлов*/
let dev = gulp.series(
    clean,
    cleanDictionaries,
    collectData,
    connectComponents,
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
exports.connectComponents = connectComponents;