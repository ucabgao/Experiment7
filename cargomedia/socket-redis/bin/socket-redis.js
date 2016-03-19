#!/usr/bin/env node
var socketRedis = require('../socket-redis.js'),
	childProcess = require('child_process'),
	utils = require('../lib/utils.js'),
	optimist = require('optimist').default('log-dir', null),
	fs = require('fs'),
	argv = optimist.default('redis-host', 'localhost').argv,
	redisHost = argv['redis-host'],
	logDir = argv['log-dir'],
	sockjsClientUrl = argv['sockjs-client-url'],
	sslKey = argv['ssl-key'],
	sslCert = argv['ssl-cert'],
	sslPfx = argv['ssl-pfx'],
	sslPassphrase = argv['ssl-passphrase'];


if (logDir) {
	utils.logProcessInto(process, logDir + '/socket-redis.log');
}

if (!process.send) {
	argv = optimist.default('socket-ports', '8090').default('status-port', '8085').argv;
	var socketPorts = String(argv['socket-ports']).split(','),
		publisher = new socketRedis.Server(redisHost, argv['status-port']);

	socketPorts.forEach(function (socketPort) {
		var args = ['--socket-port=' + socketPort];
		if (logDir) {
			args.push('--log-dir=' + logDir);
		}
		if (sockjsClientUrl) {
			args.push('--sockjs-client-url=' + sockjsClientUrl);
		}
		if (sslKey) {
			args.push('--ssl-key=' + sslKey);
		}
		if (sslCert) {
			args.push('--ssl-cert=' + sslCert);
		}
		if (sslPfx) {
			args.push('--ssl-pfx=' + sslPfx);
		}
		if (sslPassphrase) {
			args.push('--ssl-passphrase=' + sslPassphrase);
		}
		var startWorker = function () {
			var worker = childProcess.fork(__filename, args);
			publisher.addWorker(worker);
			worker.on('exit', function () {
				startWorker();
			});
			worker.on('message', function(event) {
				publisher.triggerEventUp(event.type, event.data);
			});
		};
		startWorker();
	});

	process.on('SIGTERM', function () {
		publisher.killWorkers();
		process.exit();
	});

} else {
	var sslOptions = null;
	if (sslKey && sslCert) {
		sslOptions = {
			key: fs.readFileSync(sslKey)
		};

		var certFile = fs.readFileSync(sslCert).toString();
		var certs = certFile.match(/(-+BEGIN CERTIFICATE-+[\s\S]+?-+END CERTIFICATE-+)/g);
		if (certs && certs.length) {
			sslOptions.cert = certs.shift();
			if (certs.length) {
				sslOptions.ca = certs;
			}
		} else {
			sslOptions.cert = certFile;
		}
	}
	if (sslPfx) {
		sslOptions = {
			pfx: fs.readFileSync(sslPfx)
		};
	}
	if (sslOptions && sslPassphrase) {
		sslOptions.passphrase = fs.readFileSync(sslPassphrase).toString().trim();
	}
	var socketPort = argv['socket-port'],
		worker = new socketRedis.Worker(socketPort, sockjsClientUrl, sslOptions);
	process.on('message', function (event) {
		worker.triggerEventDown(event.type, event.data);
	});
}