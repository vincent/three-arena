'use strict';

var debug = require('debug')('recast:main');

var now = require('now');

module.exports = Pathfinding;

function Pathfinding (game) {
  
  this.game = game;
  this.worker = new Worker('../lib/pathfinding/recast.worker.js');
}

Pathfinding.prototype.cb = function(funct) {
  if (typeof funct !== 'function') { return funct; }
  var tmpname = now();
  this._callbacks[tmpname] = funct;
  return tmpname;
};

Pathfinding.prototype.config = function(config, callback) {
  this.messageWorker({
    type: 'config',
    data: config
  }, callback);
};

Pathfinding.prototype.messageWorker = function(sendingMessage, callback) {
  var self = this;
  function listen(event){
    var incomingMessage = event.data;
    if (sendingMessage.funcName === incomingMessage.funcName){
      self.worker.removeEventListener('message', listen);
      callback(incomingMessage.data);
    }
  }
  if (typeof callback === 'function') {
    sendingMessage.funcName = now() + sendingMessage.type;
    this.worker.addEventListener('message', listen);
  }
  this.worker.postMessage(sendingMessage);
};



Pathfinding.prototype.ready = function() {
  debug('Pathfinding worker ready');
};

Pathfinding.prototype.initWithFile = function(data, callback) {
  this.messageWorker({
    type: 'initWithFile',
    data: data
  }, callback);
};

Pathfinding.prototype.initWithFileContent = function(data, callback) {
  this.messageWorker({
    type: 'initWithFileContent',
    data: data
  }, callback);
};

Pathfinding.prototype.getRandomPoint = function(callback) {
  this.messageWorker({
    type: 'getRandomPoint'
  }, callback);
};

Pathfinding.prototype.setPolyUnwalkable = function(position, radius, flags, callback) {
  this.messageWorker({
    type: 'setPolyUnwalkable',
    data: { sx:position.x, sy:position.y, sz:position.z, dx:radius.x, dy:radius.y, dz:radius.z, flags:flags }
  }, callback);
};

Pathfinding.prototype.findNearest = function(position, extend, callback) {
  if (typeof extend === 'function' && ! callback) {
    callback = extend;
    extend = { x: 2, y: 4, z: 2 };
  }
  this.messageWorker({
    type: 'findNearestPoint',
    data: {
      position: position,
      extend: extend
    }
  }, callback);
};

Pathfinding.prototype.findPath = function(sx, sy, sz, dx, dy, dz, max, callback) {
  this.messageWorker({
    type: 'findPath',
    data: { sx:sx, sy:sy, sz:sz, dx:dx, dy:dy, dz:dz, max:max }
  }, callback);
};

Pathfinding.prototype.addCrowdAgent = function(options, callback) {
  this.messageWorker({
    type: 'addCrowdAgent',
    data: options
  }, callback);
};

Pathfinding.prototype.updateCrowdAgentParameters = function(agent, options, callback) {
  this.messageWorker({
    type: 'updateCrowdAgentParameters',
    data: {
      agent: agent,
      options: options
    }
  }, callback);
};

Pathfinding.prototype.requestMoveVelocity = function(agent, velocity, callback) {
  this.messageWorker({
    type: 'requestMoveVelocity',
    data: {
      agent: agent,
      velocity: velocity
    }
  }, callback);
};

Pathfinding.prototype.removeCrowdAgent = function(agent, callback) {
  this.messageWorker({
    type: 'removeCrowdAgent',
    data: agent
  }, callback);
};

Pathfinding.prototype.crowdUpdate = function(delta, callback) {
  this.messageWorker({
    type: 'crowdUpdate',
    data: delta
  }, callback);
};

Pathfinding.prototype.crowdRequestMoveTarget = function(agent, position, callback) {
  this.messageWorker({
    type: 'crowdRequestMoveTarget',
    data: { agent:agent, x:position.x, y:position.y, z:position.z }
  }, callback);
};


