var equal = require('assert').equal,
  SandCastle = require('../lib').SandCastle;

exports.tests = {
  'on("exit") is fired when a sandboxed script calls the exit method': function(finished, prefix) {
    var sandcastle = new SandCastle();

    var script = sandcastle.createScript("\
      exports.main = function() {\
        var result = 1 + 1;\
        exit({\
          results: [result]\
        });\
      }\
    ");

    script.on('exit', function(err, result) {
      equal(result.results[0], 2, prefix)
      sandcastle.kill();
      finished();
    });

    script.run();
  },
  'require() cannot be called from sandbox': function(finished, prefix) {
    var sandcastle = new SandCastle();

    var script = sandcastle.createScript("\
      exports.main = function() {\
        var net = require('net');\
      }\
    ");

    script.on('exit', function(err, result) {
      equal(err.message, 'require is not defined', prefix);
      sandcastle.kill();
      finished();
    });

    script.run();
  },
  'an API can be provided for untrusted JavaScript to interact with': function(finished, prefix) {
    var sandcastle = new SandCastle({
      api: './examples/api.js'
    });

    var script = sandcastle.createScript("\
      exports.main = function() {\
        getFact(function(fact) {\
          exit(fact);\
        });\
      }\
    ");

    script.on('exit', function(err, result) {
      equal(result, 'The rain in spain falls mostly on the plain.', prefix);
      sandcastle.kill();
      finished();
    });

    script.run();
  },
  'looping script should cause timeout event to be called and sandbox to respawn': function(finished, prefix) {
    var sandcastle = new SandCastle({
      api: './examples/api.js',
      timeout: 2000
    });

    var loopingScript = sandcastle.createScript("\
      exports.main = function() {\
        while(true) {};\
      }\
    ");

    var safeScript = sandcastle.createScript("\
      exports.main = function() {\
        exit('banana');\
      }\
    ");

    safeScript.on('exit', function(err, result) {
      equal(result, 'banana', prefix);
      sandcastle.kill();
      finished();
    });

    loopingScript.on('timeout', function() {
      safeScript.run();
    });

    loopingScript.run();
  },
  'sandbox should return a human readable stacktrace': function(finished, prefix) {
    var sandcastle = new SandCastle();

    var script = sandcastle.createScript("\
        exports.main = function() {\n\
          var net = require('net');\n\
        }\n\
      "
    );

    script.on('exit', function(err, result) {
      equal(err.stack.indexOf('2:21') > -1, true, prefix);
      sandcastle.kill();
      finished();
    });
    script.run();
  },
  /*'script should be terminated if it takes up too much memory': function(finished, prefix) {
    var sandcastle = new SandCastle({
      timeout: 20000
    });

    var script = sandcastle.createScript("\
      exports.main = function() {\
        var data = '';\
        for (var i = 0; i < 1048576; i++) {\
          data += 'B';\
        };\
      }\
    ");

    script.on('timeout', function(err, result) {
      sandcastle.kill();
      finished();
    });

    script.run();
  }*/
}