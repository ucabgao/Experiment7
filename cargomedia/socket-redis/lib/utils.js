var fs = require('fs'),
	path = require('path'),
	log4js = require('log4js');

var mkdirRecursive = function(directory) {
	var pathParts = path.normalize(directory).replace(/\/$/, '').split(path.sep);
	for (var i = 0; i < pathParts.length; i++) {
		var parentDirectory = pathParts.slice(0, i + 1).join(path.sep) + '/';
		fs.mkdir(parentDirectory);
	}
};

var logProcessInto = function (process, logFile) {
	mkdirRecursive(path.dirname(logFile));
	log4js.clearAppenders();
	log4js.loadAppender('file');
	log4js.addAppender(log4js.appenders.file(logFile));
	var logger = log4js.getLogger();
	process.stdout.write = function(content) { return logger.debug(content); };
	process.stderr.write = function(content) { return logger.error(content); };
	process.on('uncaughtException', function(e) { process.stderr.write('Uncaught exception: ' + e + '\n' + e.stack + '\n'); });
};

module.exports = {
	logProcessInto: logProcessInto
};
