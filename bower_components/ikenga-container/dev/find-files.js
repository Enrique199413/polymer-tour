/*jslint node: true, indent: 2, nomen:true, stupid:true */
'use strict';
var fs = require('fs'),
  path = require('path');

module.exports = function (startDir, ext, callback) {
  function find(dir, ext, obj, callback) {
    var basedir;

    obj = obj || {};
    basedir = path.normalize(__dirname + '/../' + startDir + '/' + dir);

    fs.readdirSync(basedir).forEach(function (file) {

      if (fs.lstatSync(basedir + file).isDirectory()) {
        find(path.normalize(dir + '/' + file + '/'), ext, obj, callback);
        return obj;
      }

      if (file.substr(-ext.length) === ext) {
        obj = callback(obj, dir, file);
      }

    });

    return obj;
  }
  return find('', ext, {}, callback);
};
