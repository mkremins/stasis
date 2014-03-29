#!/usr/bin/env/node

var cheerio = require('cheerio'),
    fm = require('front-matter'),
    fs = require('fs'),
    md = require('marked'),
    mkdirp = require('mkdirp'),
    path = require('path');

function slurp(fpath) {
  return fs.readFileSync(fpath, {encoding: 'utf8'});
}

function spit(fpath, contents) {
  fs.writeFileSync(fpath, contents);
}

function readPost(fpath) {
  var content = fm(slurp('posts/' + fpath));
  return {
    name: path.basename(fpath, '.md'),
    attrs: content.attributes,
    markdown: content.body,
    html: md(content.body)
  };
}

function renderPost($, post) {
  $('body').html(post.html);
  return $.html();
}

function main() {
  console.log('Rendering static site...\n');
  var template = cheerio.load(slurp('template.html'));
  var posts = fs.readdirSync('posts').map(readPost);
  for (var i in posts) {
    var post = posts[i];
    var inPath = 'posts/' + post.name + '.md';
    var outPath = 'site/' + post.name + '/index.html';
    console.log('  ' + inPath + ' → ' + outPath);
    mkdirp.sync(path.dirname(outPath));
    spit(outPath, renderPost(template, post));
  }
  console.log('\nRendering complete.');
}

main();
