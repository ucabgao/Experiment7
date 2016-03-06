#!/usr/bin/env node

/*
* help message
*
**/
function help(argv, callback) {
  var ret = 'credit help\n';
  ret += 'commands\n';
  ret += '  balance <URI>                - shows a balance\n';
  ret += '  create                       - creates a database\n';
  ret += '  genesis                      - seeds a wallet\n';
  ret += '  help                         - shows help message\n';
  ret += '  insert <source> <amount> <unit> <destination> \n';
  ret += '     [description] [timestamp] - inserts a web credit\n';
  ret += '  reputation <URI>             - gets the reputation\n';
  ret += '  server                       - starts an express server\n';
  ret += '  websocket                    - starts a websocket server\n';
  callback(null, ret);
}

/*
* version as a command
*
**/
function bin() {
  help(process.argv, function(err, ret){
    console.log(ret);
  });
}

// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv);
}

module.exports = help;
