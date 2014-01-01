var Module = 'to be defined';
var global = this;

importScripts('recast.js');

function debug() {                                                           
  throw JSON.stringify(arguments);
}

function cb(funct) {
  'use strict';

  if (typeof funct !== 'function') { return funct; }
  var tmpname = '__tmp_' + parseInt(Math.random() * 10000000, 0);
  global[tmpname] = funct;
  return tmpname;
}

var Config = {},
    callbacks = {};

onmessage = function(event) {
  var message = event.data;

  switch(message.type) {

    case 'config':
      Module.set_cellSize(message.data.cellSize);
      Module.set_cellHeight(message.data.cellHeight);

      Module.set_agentHeight(message.data.agentHeight);
      Module.set_agentRadius(message.data.agentRadius);

      Module.set_agentMaxClimb(message.data.agentMaxClimb);
      Module.set_agentMaxSlope(message.data.agentMaxSlope);

      postMessage({
        type: 'configured',
        cb: cb(message.cb)
      });
      break;

    case 'initWithFileContent':
      Module.initWithFileContent(message.data);
      Module.build();

      postMessage({
        type: 'built',
        cb: cb(message.cb)
      });
      break;

    case 'initWithFileContent':
      Module.initWithFileContent(message.data);
      Module.build();

      postMessage({
        type: 'built',
        cb: cb(message.cb)
      });
      break;

    case 'findPath': /// FIXMEEEE !!!
      var callback = cb(function(path){
        postMessage({
          type: 'path',
          data: path,
          cb: cb(message.cb)
        });
      });
      Module.findPath(message.data.sx,message.data.sy,message.data.sz,message.data.dx,message.data.dy,message.data.dz,message.data.max,callback);
      break;
  }
};

postMessage({
  'type' : 'ready'
});


