/* */ 
(function(process) {
  var es = require('../index'),
      it = require('it-is').style('colour');
  exports['es.parse() writes parsing errors with console.error'] = function(test) {
    var parseStream = es.parse();
    var oldConsoleError = console.error;
    console.error = function() {
      console.error = oldConsoleError;
      it(arguments.length > 0).ok();
      test.done();
    };
    parseStream.write('A');
  };
  exports['es.parse({error: true(thy)}) emits error events from parsing'] = function(test) {
    var parseStream = es.parse({error: 1});
    var expectedError;
    try {
      JSON.parse('A');
    } catch (e) {
      expectedError = e;
    }
    parseStream.on('error', function(e) {
      it(e).deepEqual(expectedError);
      process.nextTick(function() {
        test.done();
      });
    }).write('A');
  };
})(require('process'));
