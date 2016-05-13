'use strict'
var path = require('path')
var fs = require('fs-extra')
var Handlebars = require('handlebars')
var minimist = require('minimist')
var debounce = require('lodash.debounce')

var OUT_DIR = 'dist'
var PARTIALS_DIR = 'partials'
var PAGES_DIR = 'pages'
var CSS_DIR = 'css'
var IMG_DIR = 'img'
var FONTS_DIR = 'fonts'
var JS_DIR = 'js'

Handlebars.registerHelper('ifEq', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

function nameToObj (dirName) {
  return (name) => {
    return {
      name: name.split('.').shift(),
      inPath: path.join(dirName, name),
      outPath: path.join(OUT_DIR, name)
    }
  }
}

function registerPartial (partial) {
  Handlebars.registerPartial(partial.name, fs.readFileSync(partial.inPath, 'utf8'))
}

function compilePage (page) {
  var temp = Handlebars.compile(fs.readFileSync(page.inPath, 'utf8'))
  fs.writeFileSync(page.outPath, temp({}))
}

function compileAllPages () {
  var pageFiles = fs.readdirSync(PAGES_DIR)
        .map(nameToObj(PAGES_DIR))
  pageFiles.forEach(compilePage)
}


// For the Watchers
function incrementalPageBuild (filename) {
  console.log('Re-compiling page', filename)
  compilePage(nameToObj(PAGES_DIR)(filename))
}

function incrementalPartialBuild (filename) {
  console.log('Updating partial', filename)
  registerPartial(nameToObj(PARTIALS_DIR)(filename))
  console.log('Re-compiling all pages')
  compileAllPages()
}

function copyCSSFile (filename) {
  console.log('Updating CSS', filename)
  fs.copy(path.join(CSS_DIR, filename), path.join(OUT_DIR, CSS_DIR, filename))
}

// Where the magic happens
function main () {
  fs.removeSync(OUT_DIR)
  fs.mkdirSync(OUT_DIR)
  fs.copy(CSS_DIR, path.join(OUT_DIR, CSS_DIR))
  fs.copy(IMG_DIR, path.join(OUT_DIR, IMG_DIR))
  fs.copy(FONTS_DIR, path.join(OUT_DIR, FONTS_DIR))
  fs.copy(JS_DIR, path.join(OUT_DIR, JS_DIR)) // TODO: combine all scripts

  var partialFiles = fs.readdirSync(PARTIALS_DIR).map(nameToObj(PARTIALS_DIR))
  partialFiles.forEach(registerPartial)

  compileAllPages()

  var cliArgs = minimist(process.argv)
  if (!cliArgs.watch) return // only continue to watchers if '--watch' flag used

  console.log('Watching...')

  var WAIT_TIME = 400 // milliseconds to wait
  var debouncedPageBuild = debounce(incrementalPageBuild, WAIT_TIME)
  var debouncedPartialBuild = debounce(incrementalPartialBuild, WAIT_TIME)
  var debouncedCSSCopy = debounce(copyCSSFile, WAIT_TIME)

  var pageWatcher = fs.watch(PAGES_DIR)
  pageWatcher.on('change', (event, filename) => {
    if (event === 'change') {
      debouncedPageBuild(filename)
    }
  })

  var partialWatcher = fs.watch(PARTIALS_DIR)
  partialWatcher.on('change', (event, filename) => {
    if (event === 'change') {
      debouncedPartialBuild(filename)
    }
  })

  var cssWatcher = fs.watch(CSS_DIR)
  cssWatcher.on('change', (event, filename) => {
    if (event === 'change') {
      debouncedCSSCopy(filename)
    }
  })
}

// Execute the main function
main()
