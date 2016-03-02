'use strict';

module.exports = function(grunt) {

	var fs = require('fs');

	// version info
	var util = {
		pkg: grunt.file.readJSON('package.json'),
		uglify_lib_list: [] 	// set by 'lib-min-js' task
	};

	util.getMinorVersion = function () {
		var version = util.pkg.version;

		// length = index of second '.'
		var length = version.indexOf('.');
		length = version.indexOf('.', length + 1);

		// format = major.minor
		return version.substr(0, length);
	};

	// ---------------
	// Setup tasks
	var config = {
		pkg: util.pkg
	};

	(function () {
		var list = fs.readdirSync('./tasks/config');

		for (var i=0; i<list.length; i++) {
			var name = list[i].substr(0, list[i].indexOf('.js'));
			config[name] = require('./tasks/config/' + list[i]);

			// case: config object needs util object
			if (typeof config[name] === 'function') {
				config[name] = config[name](util);
			}

			//grunt.log.writeln('-- config: ' + name);
		}

		//grunt.log.writeln('');
	})();

	grunt.initConfig(config);

	// Load tasks from node_modules
	require('load-grunt-tasks')(grunt);

	// Load custom tasks
	// grunt.registerTask('default', []);
	(function () {
		var list = fs.readdirSync('./tasks/custom');
		for (var i=0; i<list.length; i++) {
			var name = list[i].substr(0, list[i].indexOf('.js'));
			require('./tasks/custom/' + list[i])(grunt, util);

			//grunt.log.writeln('-- custom: ' + name);
		}
	})();

};
