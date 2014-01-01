
var Module = {
  canvas: {},
  noInitialRun: true,
  noFSInit: true
};

var worker;

var process = require = false;

Module.initWorker = function () {

  worker = new Worker(__FILE__ + '.worker.js');

  worker.onmessage = function(event) {
    var message = event.data;

    if (message.type === 'stdout') {

      console.log( message.line + '\n' );

    } else if (message.type === 'start') {

      console.log( 'start' );

    } else if (message.type === 'done') {
      //
      console.log( 'Done!' );

    } else if (message.type === 'ready') {

      console.log( 'I\'m ready! ...' );
    }
  };
};

