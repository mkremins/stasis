#!/usr/bin/env/node

var cheerio = require('cheerio'),
    fm      = require('front-matter'),
    fs      = require('fs'),
    md      = require('marked'),
    mkdirp  = require('mkdirp'),
    path    = require('path');

var outputDir    = 'site',
    postsDir     = 'posts',
    templatesDir = 'templates';

function slurp(fpath) {
  return fs.readFileSync(fpath, {encoding: 'utf8'});
}

function spit(fpath, contents) {
  fs.writeFileSync(fpath, contents);
}

function readPost(fpath) {
  var content = fm(slurp(path.join(postsDir, fpath)));
  return {
    name: path.basename(fpath, '.md'),
    attrs: content.attributes,
    markdown: content.body,
    html: md(content.body)
  };
}

function readTemplate(fpath) {
  var content = slurp(path.join(templatesDir, fpath));
  return {
    name: path.basename(fpath, '.html'),
    html: content,
    $: cheerio.load(content)
  };
}

function loadTemplates() {
  var templates = fs.readdirSync(templatesDir).map(readTemplate);
  var templatesHash = {};
  for (var i in templates) {
    var template = templates[i];
    templatesHash[template.name] = template;
  }
  return templatesHash;
}

function renderPost(templates, post) {
  var templateName = post.attrs.template || 'default';
  var template = templates[templateName];
  if (!template) {
    throw new Error('Missing template: ' + templateName);
  }
  template.$('body').html(post.html);
  return template.$.html();
}

function main() {
  console.log('Rendering static site...\n');
  var templates = loadTemplates();
  var posts = fs.readdirSync(postsDir).map(readPost);
  for (var i in posts) {
    var post = posts[i];
    var inPath  = path.join(postsDir, post.name + '.md');
    var outPath = path.join(outputDir, post.name, 'index.html');
    console.log('  ' + inPath + ' → ' + outPath);
    mkdirp.sync(path.dirname(outPath));
    spit(outPath, renderPost(templates, post));
  }
  console.log('\nRendering complete.');
}

main();
