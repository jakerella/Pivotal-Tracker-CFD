module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        clean: [ "app" ],

        copy: {
            images: {
                expand: true,
                src: [ "images/**/*.*" ],
                cwd: "source/public/",
                dest: "app/public/"
            },
            serverjs: {
                expand: true,
                src: [ "modules/**/*.js", "app.js" ],
                cwd: "source/",
                dest: "app/"
            },
            views: {
                expand: true,
                src: [ "views/**/*.jade" ],
                cwd: "source/",
                dest: "app/"
            }
        },

        concat: {
            // JS concatenation is explicit to preserve order
            libjs: {
                src: [ "source/public/script/lib/jquery-1.10.2.min.js", "source/public/script/lib/jquery.cookie.js", "source/public/script/lib/flot/jquery.flot.min.js", "source/public/script/lib/flot/excanvas.min.js", "source/public/script/lib/flot/jquery.flot.*.min.js" ],
                dest: "app/public/script/lib.js"
            },
            appjs: {
                src: [ "source/public/script/client.js" ],
                dest: "app/public/script/client.js"
            }
        },

        sass: {
            all: {
                files: {
                    "app/public/style/normalize.css": "source/public/scss/normalize.scss",
                    "app/public/style/base.css": "source/public/scss/base.scss"
                }
            }
        },

        watch: {
            clientjs: {
                files: [ "source/public/script/*.js" ],
                tasks: [ "concat:appjs" ],
                options: { nospawn: true }
            },
            libjs: {
                files: [ "source/public/script/lib/*.js" ],
                tasks: [ "concat:libjs" ],
                options: { nospawn: true }
            },
            serverjs: {
                files: [ "source/modules/**/*.js" ],
                tasks: [ "copy:serverjs" ],
                options: { nospawn: true }
            },
            scss: {
                files: [ "source/public/scss/**/*.scss" ],
                tasks: [ "sass" ],
                options: { nospawn: true }
            },
            images: {
                files: [ "source/public/images/**/*.*" ],
                tasks: [ "copy:views" ],
                options: { nospawn: true }
            },
            views: {
                files: [ "source/views/**/*.jade" ],
                tasks: [ "copy:views" ],
                options: { nospawn: true }
            }
        },

        jshint: {
            files: [ "source/modules/**/*.js", "source/public/script/*.js" ],
            options: {
                force: true,
                jshintrc: "./.jshintrc"
            }
        }

    });

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.registerTask( "dev", [ "clean", "jshint", "concat", "sass", "copy" ] );
    grunt.registerTask( "deploy", [ "clean", "concat", "sass", "copy" ] );
    grunt.registerTask( "heroku:production", "deploy" );
    grunt.registerTask( "heroku:development", "deploy" );

    grunt.registerTask( "default", [ "dev" ] );

};
