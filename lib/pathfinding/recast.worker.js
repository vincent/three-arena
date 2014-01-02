var Module = 'to be defined';
var global = this;

importScripts('recast.js');

var ajax = function(url, data, callback, type) {
  var data_array, data_string, idx, req, value;
  if (data == null) {
    data = {};
  }
  if (callback == null) {
    callback = function() {};
  }
  if (type == null) {
    //default to a GET request
    type = 'GET';
  }
  data_array = [];
  for (idx in data) {
    value = data[idx];
    data_array.push("" + idx + "=" + value);
  }
  data_string = data_array.join("&");
  req = new XMLHttpRequest();
  req.open(type, url, false);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onreadystatechange = function() {
    if (req.readyState === 4 && req.status === 200) {
      return callback(req.responseText);
    }
  };
  req.send(data_string);
  return req;
};

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

    case 'initWithFile':

      ajax(message.data, {}, function(data) {
        Module.initWithFileContent(data);
        Module.build();

        postMessage({
          type: 'built',
          cb: cb(message.cb)
        });
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

    case 'findPath':
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


