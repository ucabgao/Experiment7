
// gm - Copyright Aaron Heckmann <aaron.heckmann+github@gmail.com> (MIT Licensed)

var fs = require('fs');

module.exports = function (gm, dir, finish) {

  gm
  .stream(function streamOut (err, stdout, stderr) {
    if (err) return finish(err);
    stdout.pipe(fs.createWriteStream(dir + '/streamOut.jpg'));
    stdout.on('error', finish);
    stdout.on('close', finish);
  });
}
