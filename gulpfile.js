const { stream } = require('browser-sync');

/*переменные для массива объектов с путями*/
const DIST = "dist";
const SOURCE = "#src";

/*file system*/
let fs = require('fs');
// для работы с путями
const path = require('path');

/*==============================
------- Project paths  ---------
==============================*/

const pathsEnum = Object.freeze({
    BUILD: {
        HTML: DIST + '/',
        CSS: DIST + '/css/',
        JAVASCRIPT: DIST + '/js/',
        IMG: DIST + '/img/',
        FONTS: DIST + '/fonts',
        FAVICONS: DIST + '/favicons/'
    },
    SRC: {
        PUG: SOURCE + '/pages/**/*.pug',
        STYLES: SOURCE + '/scss/styles.scss',
        JAVASCRIPT: SOURCE + '/pages/**/*.js',
        IMG: SOURCE + '/img/**/*.+(png|jpg|gif|ico|svg|webp)',
        FONTS: SOURCE + '/fonts/*.{ttf, TTF}',
        FAVICONS: SOURCE + '/favicons/**/*.+(png|svg|ico)',
        ICONS: SOURCE + '/icons/**/**/*.svg',
        DICTIONARIES: SOURCE + '/dictionaries/*.pug',
        DATA_FILES: SOURCE + '/sections/**/data/*.pug',
        SECTIONS: {
            PUG: SOURCE + '/sections/**/*.pug',
            SCSS: SOURCE + '/sections/**/*.scss'
        },
        PAGES: {
            PUG: SOURCE + '/pages/**/*.pug',
            SCSS: SOURCE + '/pages/**/*.scss'
        }
    },
    WATCH: {
        PUG: SOURCE + '/**/**/*.pug',
        STYLES: SOURCE + '/**/*.+(scss|sass)',
        JAVASCRIPT: SOURCE + '/**/*.js',
        IMG: SOURCE + '/img/**/*.+(png|jpg|gif|ico|svg|webp)',
        ICONS: SOURCE + '/icons/**/**/*.svg',
        DICTIONARIES: SOURCE + '/dictionaries/*.pug'
    },
    CLEAN: './' + DIST + '/' //путь для удаления папки dist, чтобы каждый раз перед прогоном бандла функций галпа удалять ненужные файлы
});

//для преттифаера html
var prettyOption = {
    indent_size: 4,
    indent_char: ' ',
    unformatted: ['code', 'em', 'strong', 'span', 'i', 'b', 'br', 'script'],
    content_unformatted: [],
};

//тип шаблона для всех страниц, используется в функции подключения/удаления секций к страницам
const LAYOUT_TYPE = 'default';

/*==========================================================================
--- Define Node modules as Gulp dependencies for further manipulations -----
==========================================================================*/

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

//слуга
const sv = require('./servant');
const servant = new sv.Servant();

/*==================================================================
----------- Clean all imports & includes from sections -------------
==================================================================*/

function cleanAllImports() {
    return src([pathsEnum.SRC.SECTIONS.PUG, `!${pathsEnum.SRC.DATA_FILES}`])
        .pipe(through2.obj(function(file, enc, cb) {
            servant.cleanAllImports(file.path, 'componentTemplate');
            cb();
        }))
        .pipe(src([pathsEnum.SRC.SECTIONS.SCSS]))
        .pipe(through2.obj(function(file, enc, cb) {
            servant.cleanAllImports(file.path, 'componentStyle');
            cb();
        }))
}

/*==========================================================================
------- Collect data files in sections & include into dictionaries ---------
==========================================================================*/

function updateDictionaries() {
    return src(pathsEnum.SRC.DICTIONARIES)
        .pipe(through2.obj(function(file, enc, cb) {
            servant.cleanDictionary(file.path);
            servant.updateDictionary(file.path);
            cb();
        }))
}

/*=====================================================
----------- Connect modules with sections -------------
=====================================================*/

function connectModules() {
    return src([pathsEnum.SRC.SECTIONS.PUG, `!${pathsEnum.SRC.DATA_FILES}`])
        .pipe(through2.obj((file, enc, cb) => {
            servant.cleanUnusedImports(file.path, 'componentTemplate');
            servant.connectComponents(file.path, 'modules');
            cb()
        }))
        .pipe(src(pathsEnum.SRC.SECTIONS.SCSS))
        .pipe(through2.obj((file, enc, cb) => {
            servant.cleanUnusedImports(file.path, 'componentStyle');
            cb()
        }))
}

/*=====================================================
----------- Connect sections with pages ---------------
=====================================================*/

function connectSections() {
    return src(pathsEnum.SRC.PAGES.PUG)
        .pipe(through2.obj((file, enc, cb) => {
            servant.cleanUnusedImports(file.path, 'componentTemplate');
            servant.connectComponents(file.path, 'sections');
            servant.setLayoutForPages(file.path, LAYOUT_TYPE);
            cb()
        }))
        .pipe(src(pathsEnum.SRC.PAGES.SCSS))
        .pipe(through2.obj((file, enc, cb) => {
            servant.cleanUnusedImports(file.path, 'componentStyle');
            cb()
        }))
}

/*=======================================================
------ Copy & optimize favicons into dist folder --------
========================================================*/

function copyFavicons() {
    return src(pathsEnum.SRC.FAVICONS)
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 2 // от 0 до 7
            })
        )
        .pipe(dest(pathsEnum.BUILD.FAVICONS))
}

/*============================================================
------- Transpile pug templates into prettified HTML ---------
============================================================*/

function pug2html() {
    return src(pathsEnum.SRC.PAGES.PUG)
        .pipe(pug())
        .pipe(prettyHtml(prettyOption))
        .pipe(rename({ dirname: "" }))
        .pipe(dest(pathsEnum.BUILD.HTML))
        .pipe(browsersync.stream())
}

/*=====================================================================================
------- Group @media, add prefixes, optimize, transpile SCSS and bundle to CSS --------
=====================================================================================*/

function css() {
    return src(pathsEnum.SRC.STYLES)
        .pipe(
            scss({
                outputStyle: 'expanded'
            })
        )
        .pipe(
            group_media()
        )
        // .pipe(webp_css())
        .pipe(dest(pathsEnum.BUILD.CSS))//выхлоп несжатого css без чистки и оптимизации медиазапросов
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
        .pipe(dest(pathsEnum.BUILD.CSS))//выхлоп сжатого на проду
        .pipe(browsersync.stream())
}

/*============================================================
------- Minify, transpile to ES5 & bundle JavaScript ---------
============================================================*/

function js() {
    return src(pathsEnum.SRC.JAVASCRIPT)
        .pipe(rollup({ plugins: [commonjs(), resolve(), babel({ presets: ['@babel/env'] })] },
            {
                format: "iife"
            }))
        .pipe(rename({ dirname: "" }))
        .pipe(dest(pathsEnum.BUILD.JAVASCRIPT))
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: ".min.js",
            })
        )
        .pipe(rename({ dirname: "" }))
        .pipe(dest(pathsEnum.BUILD.JAVASCRIPT))
        .pipe(browsersync.stream())
}

/*===================================
--------- Optimize images -----------
====================================*/

function images() {
    return src(pathsEnum.SRC.IMG)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(pathsEnum.BUILD.IMG))
        .pipe(src(pathsEnum.SRC.IMG))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3 // от 0 до 7
            })
        )
        .pipe(dest(pathsEnum.BUILD.IMG))
        .pipe(browsersync.stream())
}

/*===================================
---------- Convert fonts ------------
====================================*/

function fonts(params) {
    return src(pathsEnum.SRC.FONTS)
        .pipe(ttf2woff2())
        .pipe(dest(pathsEnum.BUILD.FONTS));
}

/*===================================
--------- Make svg sprite -----------
====================================*/

function makeSprite() {
    return gulp.src(pathsEnum.SRC.ICONS)
        .pipe(svg_sprite({
            mode: {
                stack: {
                    sprite: '../icons/sprite.svg', //имя файла спрайта
                    example: false
                }
            }
        }))
        .pipe(dest(pathsEnum.BUILD.IMG))
}

/*===================================
-------- Clean dist folder ----------
====================================*/

//функция для удаления папки dist целиком перед серией выполняемых фукций
function clean(params) {
    return del(pathsEnum.CLEAN);
}

/*===================================
--------- Local Web Server ----------
====================================*/

const serve = (cb) => {
    browsersync.init({
        server: {
            baseDir: "./" + DIST + "/"
        },
        notify: false,
        open: true,
        cors: true,
        startPath: '/index.html'
    });

    gulp.watch([pathsEnum.WATCH.IMG], series(images)).on('change', browsersync.reload);
    gulp.watch([pathsEnum.WATCH.ICONS], series(makeSprite)).on('change', browsersync.reload);
    gulp.watch([pathsEnum.WATCH.STYLES], series(css)).on('change', browsersync.reload);
    gulp.watch([pathsEnum.WATCH.JAVASCRIPT], series(js)).on('change', browsersync.reload);
    gulp.watch([pathsEnum.WATCH.DICTIONARIES], series(updateDictionaries));
    gulp.watch([pathsEnum.WATCH.PUG], series(connectModules, connectSections, pug2html)).on('change', browsersync.reload);

    return cb();
}

/*закрываю в параллель для одновременного выполнения функции обработки ключевых файлов*/
let dev = gulp.series(
    clean,
    updateDictionaries,
    connectModules,
    connectSections,
    gulp.parallel(
        js,
        css,
        pug2html,
        images,
        copyFavicons,
        fonts,
        makeSprite
    ),
    serve
);

exports.dev = dev;
exports.default = dev;
exports.connectModules = connectModules;
exports.updateDictionaries = updateDictionaries;

exports.cleanAllImports = cleanAllImports;