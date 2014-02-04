'use strict';

// var debug = require('debug')('recast:worker');

var Module = 'to be defined';
var global = this;

importScripts('recast.js');

//////////////////////////////////////////

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
    data_array.push('' + idx + '=' + value);
  }
  data_string = data_array.join('&');
  req = new XMLHttpRequest();
  req.open(type, url, false);
  req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  req.onreadystatechange = function() {
    if (req.readyState === 4 && req.status === 200) {
      return callback(req.responseText);
    }
  };
  // debug('ajax request', data_string);
  req.send(data_string);
  return req;
};

function debug() {                                                           
  throw JSON.stringify(arguments);
}

function cb(funct) {
  if (typeof funct !== 'function') { return funct; }
  var tmpname = '__tmp_' + parseInt(Math.random() * 10000000, 0);
  global[tmpname] = funct;
  setTimeout(function(){ delete global[tmpname]; }, 10 * 60 * 1000);
  return tmpname;
}

//////////////////////////////////////////

function AgentPool (n) {
  this.__pools = [];
  var i = 0;
  while (i < n) {
    this.__pools[i] = { position:{}, velocity:{} };
    i++;
  }
  // debug('__pools is %o length', this.__pools.length);
}

// Get a new array
AgentPool.prototype.get = function() {
  if ( this.__pools.length > 0 ) {
    return this.__pools.pop();
  }

  // console.log( "pool ran out!" )
  return null;
};

// Release an array back into the pool
AgentPool.prototype.add = function( v ) {
  this.__pools.push( v );
};

var agentPool = new AgentPool(100);

//////////////////////////////////////////


var Config = {};

onmessage = function(event) {
  var message = event.data;

  // debug('got message', message.type, message.data);

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
        funcName: message.funcName
      });
      break;

    case 'initWithFile':

      ajax(message.data, {}, function(data) {
        Module.initWithFileContent(data);
        Module.build();
        Module.initCrowd(1000, 1.0);

        postMessage({
          type: 'built',
          funcName: message.funcName
        });
      });
      break;

    case 'initWithFileContent':
      Module.initWithFileContent(message.data);
      Module.build();

      postMessage({
        type: 'built',
        funcName: message.funcName
      });
      break;

    case 'findNearestPoint':
      var callback = cb(function(point){
        postMessage({
          type: 'nearestPoly',
          data: point,
          funcName: message.funcName
        });
      });
      Module.findNearestPoint(
        message.data.position.x,
        message.data.position.y,
        message.data.position.z,
        message.data.extend.x,
        message.data.extend.y,
        message.data.extend.z,
        callback
      );
      break;

    case 'findPath':
      var callback = cb(function(path){
        postMessage({
          type: 'path',
          data: path,
          funcName: message.funcName
        });
      });
      Module.findPath(message.data.sx, message.data.sy, message.data.sz, message.data.dx, message.data.dy, message.data.dz, message.data.max, callback);
      break;

    case 'getRandomPoint':
      var callback = cb(function(point){
        postMessage({
          type: 'randomPoint',
          data: point,
          funcName: message.funcName
        });
      });
      Module.getRandomPoint(callback);
      break;

    case 'setPolyUnwalkable':
      Module.setPolyUnwalkable(message.data.sx, message.data.sy, message.data.sz, message.data.dx, message.data.dy, message.data.dz, message.data.flags);
      break;

    case 'addCrowdAgent':
      var idx = Module.addCrowdAgent(
        message.data.position.x,
        message.data.position.y,
        message.data.position.z,
        message.data.radius,
        message.data.height,
        message.data.maxAcceleration,
        message.data.maxSpeed,
        message.data.updateFlags,
        message.data.separationWeight
      );
      postMessage({
        type: 'addedCrowdAgent',
        data: idx,
        funcName: message.funcName
      });
      break;

    case 'updateCrowdAgentParameters':
      Module.updateCrowdAgentParameters(message.data.agent,
        message.data.options.position.x,
        message.data.options.position.y,
        message.data.options.position.z,
        message.data.options.radius,
        message.data.options.height,
        message.data.options.maxAcceleration,
        message.data.options.maxSpeed,
        message.data.options.updateFlags,
        message.data.options.separationWeight
      );
      break;

    case 'requestMoveVelocity':
      Module.requestMoveVelocity(message.data.agent, message.data.velocity.x, message.data.velocity.y, message.data.velocity.z);
      break;

    case 'removeCrowdAgent':
      Module.removeCrowdAgent(message.data);
      break;

    case 'crowdRequestMoveTarget':
      Module.crowdRequestMoveTarget(message.data.agent, message.data.x, message.data.y, message.data.z);
      break;

    case 'crowdUpdate':
      Module.crowdUpdate(message.data);
      var callback = cb(function(path){
        postMessage({
          type: 'activeAgents',
          data: path,
          funcName: message.funcName
        });
      });
      Module.crowdGetActiveAgents(callback);
      break;
  }
};

postMessage({
  'type' : 'ready'
});


