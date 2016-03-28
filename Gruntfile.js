/*jslint node: true, indent: 2, nomen:true, stupid:true */
'use strict';
var findFiles = require('./dev/find-files'),
  path = require('path');

module.exports = function (grunt) {
  var browserified, lessFiles, jadeFiles, vulcanizeFiles;


  /**
   * Prepare list of existing files for Grunt tasks.
   */
  browserified = findFiles('src/', '.browserify.js', function (obj, dir, file) {
    var src = path.normalize('dist/' + dir + '/' + file),
      dst = path.normalize('src/' + dir + '/' + file);
    obj[src] = [ dst ];

    return obj;
  });

  lessFiles = findFiles('src/', '.less', function (obj, dir, file) {
    var cssName, src, dst;

    cssName = file.substring(0, file.indexOf('.less')) + '.css';
    src = path.normalize('dist/' + dir + '/' + cssName);
    dst = path.normalize('src/' + dir + '/' + file);

    obj[src] = [ dst ];
    return obj;
  });

  jadeFiles = findFiles('src/', '.jade', function (obj, dir, file) {
    var src, dst;

    src = path.normalize('dist/' + dir + '/');
    dst = path.normalize('src/' + dir + '/' + file);

    if (!Array.isArray(obj[src])) {
      obj[src] = [];
    }
    obj[src].push(dst);
    return obj;
  });

  vulcanizeFiles = findFiles('dist/', '.html', function (obj, dir, file) {
    var name;

    name = path.normalize('dist/' + dir + '/' + file);
    obj[name] = name;

    return obj;
  });



  // Project configuration.
  grunt.initConfig({
    pkg     : grunt.file.readJSON('package.json'),
    jslint  : {
      all     : {
        src : [
          'ikenga.json',
          'dev/**/*.js',
          'src/**/*.js',
          'static/**/*.js',
          'package.json',
          'bower.json',
          'server.js',
          'Gruntfile.js'
        ],
        exclude : [ ],
        directives : {
          indent : 2,
          node : true
        }
      }
    },
    less : {
      build : {
        options : {
          compress : true
        },
        files : lessFiles
      }
    },
    jade: {
      target : {
        files: jadeFiles,
        options: {
          client: false
        }
      }
    },
    browserify: {
      default : {
        files : browserified,
        options: {
          transform: [ 'browserify-shim']
        }
      }
    },
    uglify  : {
      target : {
        files : Object.keys(browserified).reduce(function (a, b) {
          a[b] = b;
          return a;
        }, {})
      }
    },
    vulcanize: {
      default: {
        options: {
          inlineScripts : true,
          inlineCss : true,
          stripExcludes : false,
          excludes : [
            __dirname + '/bower_components/'
          ]
        },
        files: vulcanizeFiles
      }
    },
    clean : [ 'dist/*.browserify.js', 'dist/*.css' ],
    replace : {
      default : {
        src: ['dist/*'],
        dest: 'dist/',
        replacements: [{
          from: 'bower_components',
          to: '..'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jade');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-vulcanize');
  grunt.loadNpmTasks('grunt-text-replace');


  // Default task(s).
  grunt.registerTask('default', [
    'jslint',
    'jade',
    'less',
    'browserify',
    'uglify:target',
    'vulcanize',
    'replace',
    'clean'
  ]);

};
