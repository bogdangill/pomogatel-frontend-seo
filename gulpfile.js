const { stream } = require('browser-sync');

/*переменные для массива объектов с путями*/
let project_folder = "dist";
let source_folder = "#src";

/*file system*/
let fs = require('fs');

/*
 
 ___  ____ ___ _  _ ____ 
 |__] |__|  |  |__| [__  
 |    |  |  |  |  | ___] 
                         
 
*/

let path = {
  build: {
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
    fonts: project_folder + "/fonts/"
  },
  src: {
    pug: source_folder + "/pages/**/*.pug",
    css: source_folder + "/scss/styles.scss",
    js: source_folder + "/pages/**/*.js",
    img: source_folder + "/img/**/*.+(png|jpg|gif|ico|svg|webp)",
    fonts: source_folder + "/fonts/*.{ttf, TTF}"
  },
  watch: { //какие файлы слушаем для сихронизации с browsersync
    pug: source_folder + "/**/*.pug",
    css: source_folder + "/**/*.+(scss|sass)",
    js: source_folder + "/**/*.js",
    img: source_folder + "/img/**/*.+(png|jpg|gif|ico|svg|webp)",
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

const {src, dest, series, parallel} = require('gulp'),
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
  commonjs = require('rollup-plugin-commonjs');

/*
 
 ____ _  _ _  _ ____ ___ _ ____ _  _ ____ 
 |___ |  | |\ | |     |  | |  | |\ | [__  
 |    |__| | \| |___  |  | |__| | \| ___] 
                                          
 
*/

function parseJSON() {

}

/*
 
 ___  _  _ ____ 
 |__] |  | | __ 
 |    |__| |__] 
                
 
*/

function pug2html() {
  return src([path.src.pug, "!#src/pages/**/connectors/*.connector.pug"])
    .pipe(pug({locals: JSON.parse(fs.readFileSync('#src/dictionaries/ru.json'))}))
    .pipe(prettyHtml(prettyOption))
    .pipe(rename({dirname: ""}))
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

/*
 
 ____ ____ ____ 
 |    [__  [__  
 |___ ___] ___] 
                
 
*/

function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: 'expanded'
      })
    )
    .pipe(
      group_media()
    )
    // .pipe(webp_css())
    .pipe(dest(path.build.css))//выхлоп несжатого css без чистки и оптимизации медиазапросов
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
    .pipe(dest(path.build.css))//выхлоп сжатого на проду
    .pipe(browsersync.stream())
}

/*
 
  _ ____ _  _ ____ ____ ____ ____ _ ___  ___ 
  | |__| |  | |__| [__  |    |__/ | |__]  |  
 _| |  |  \/  |  | ___] |___ |  \ | |     |  
                                             
 
*/

function js() {
  return src(path.src.js)
    .pipe(rollup({ plugins: [commonjs(), resolve(), babel({presets: ['@babel/env']})] }, 
    {
      format: "iife"
    }))
    .pipe(rename({dirname: ""}))
    .pipe(dest(path.build.js))
    .pipe(
      uglify()
    )
    .pipe(
      rename({
        extname: ".min.js",
      })
    )
    .pipe(rename({dirname: ""}))
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

/*
 
 _ _  _ ____ ____ ____ ____ 
 | |\/| |__| | __ |___ [__  
 | |  | |  | |__] |___ ___] 
                            
 
*/

function images() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        interlaced: true,
        optimizationLevel: 3 // от 0 до 7
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

/*
 
 ____ ____ _  _ ___    ____ ____ _  _ _  _ ____ ____ ___ ____ ____ 
 |___ |  | |\ |  |     |    |  | |\ | |  | |___ |__/  |  |___ |__/ 
 |    |__| | \|  |     |___ |__| | \|  \/  |___ |  \  |  |___ |  \ 
                                                                   
 
*/

function fonts(params) {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts));
}

/*
 
 ____ ___  ____ _ ___ ____    _  _ ____ _  _ ____ ____ 
 [__  |__] |__/ |  |  |___    |\/| |__| |_/  |___ |__/ 
 ___] |    |  \ |  |  |___    |  | |  | | \_ |___ |  \ 
                                                       
 
*/

function makeSprite() {
  return gulp.src([source_folder + '/icons/**/**/*.svg'])
    .pipe(svg_sprite({
      mode: {
        stack: {
          sprite: '../icons/sprite.svg', //имя файла спрайта
          example: false
        }
      }
    }))
    .pipe(dest(path.build.img))
}

/*
 
 ____ _    ____ ____ _  _ 
 |    |    |___ |__| |\ | 
 |___ |___ |___ |  | | \| 
                          
 
*/

//функция для удаления папки dist целиком перед серией выполняемых фукций
function clean(params) {
  return del(path.clean);
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

  gulp.watch([path.watch.img], series(images)).on('change', browsersync.reload);
  gulp.watch([source_folder + '/iconsprite/*.svg'], series(makeSprite)).on('change', browsersync.reload);
  gulp.watch([path.watch.css], series(css)).on('change', browsersync.reload);
  gulp.watch([path.watch.js], series(js)).on('change', browsersync.reload);
  gulp.watch([path.watch.pug], series(pug2html)).on('change', browsersync.reload);

  return cb();
}

/*закрываю в параллель для одновременного выполнения функции обработки ключевых файлов*/
let dev = gulp.series(clean, gulp.parallel(js, css, pug2html, images, fonts, makeSprite), DAEMON);

exports.dev = dev;
exports.default = dev;