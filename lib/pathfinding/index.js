'use strict';

var debug = require('debug')('recast:main');
var inherits = require('inherits');
var EventEmitter = require('EventEmitter');

// var now = require('now');

module.exports = Pathfinding;

var callbacks = {}, next = 0;

function Pathfinding () {

  var self = this;

  var emitable = {
    activeAgents: true,
    configured: true,
    built: true
  };

  this.worker = new Worker('../lib/pathfinding/recast.worker.js');

  this.worker.addEventListener('message', function(event){
    var data = event.data;

    if (emitable[data.type]) {
      self.emit(data.type, data.data);
    }

    if (data.funcName !== undefined && callbacks[data.funcName]) {
      callbacks[data.funcName](data.data);
      delete callbacks[data.funcName];
    }
  });
}

inherits(Pathfinding, EventEmitter);

Pathfinding.prototype.messageWorker = function(type, data, callback) {
  var self = this;
  var sendingMessage = {
    type: type,
    data: data
  };
  if (typeof callback === 'function') {
    var funcName = next++;
    callbacks[funcName] = callback;
    sendingMessage.funcName = funcName;
  }
  setTimeout(function(){
    self.worker.postMessage(sendingMessage);
  }, 0);
};

Pathfinding.prototype.config = function(config, callback) {
  this.messageWorker('config', config, callback);
};

Pathfinding.prototype.ready = function() {
  debug('Pathfinding worker ready');
};

Pathfinding.prototype.initWithFile = function(data, callback) {
  this.messageWorker('initWithFile', data, callback);
};

Pathfinding.prototype.initWithFileContent = function(data, callback) {
  this.messageWorker('initWithFileContent', data, callback);
};

Pathfinding.prototype.getRandomPoint = function(callback) {
  this.messageWorker('getRandomPoint', null, callback);
};

Pathfinding.prototype.setPolyUnwalkable = function(position, radius, flags, callback) {
  this.messageWorker('setPolyUnwalkable', { sx:position.x, sy:position.y, sz:position.z, dx:radius.x, dy:radius.y, dz:radius.z, flags:flags }, callback);
};

Pathfinding.prototype.findNearest = function(position, extend, callback) {
  if (typeof extend === 'function' && ! callback) {
    callback = extend;
    extend = { x: 2, y: 4, z: 2 };
  }
  this.messageWorker('findNearestPoint', {
    position: position,
    extend: extend
  }, callback);
};

Pathfinding.prototype.findPath = function(sx, sy, sz, dx, dy, dz, max, callback) {
  this.messageWorker('findPath', { sx:sx, sy:sy, sz:sz, dx:dx, dy:dy, dz:dz, max:max }, callback);
};

Pathfinding.prototype.addCrowdAgent = function(options, callback) {
  this.messageWorker('addCrowdAgent', options, callback);
};

Pathfinding.prototype.updateCrowdAgentParameters = function(agent, options, callback) {
  this.messageWorker('updateCrowdAgentParameters', {
    agent: agent,
    options: options
  }, callback);
};

Pathfinding.prototype.requestMoveVelocity = function(agent, velocity, callback) {
  this.messageWorker('requestMoveVelocity', {
    agent: agent,
    velocity: velocity
  }, callback);
};

Pathfinding.prototype.removeCrowdAgent = function(agent, callback) {
  this.messageWorker('removeCrowdAgent', agent, callback);
};

Pathfinding.prototype.crowdUpdate = function(delta, callback) {
  this.messageWorker('crowdUpdate', delta, callback);
};

Pathfinding.prototype.crowdRequestMoveTarget = function(agent, position, callback) {
  this.messageWorker('crowdRequestMoveTarget', { agent:agent, x:position.x, y:position.y, z:position.z }, callback);
};


