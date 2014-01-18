'use strict';

var debug = require('debug')('recast:main');

module.exports = Pathfinding;

function Pathfinding (game) {

  var self = this;
  
  this.game = game;
  this.worker = new Worker('../lib/pathfinding/recast.worker.js');

  this._callbacks = {};

  this.worker.onmessage = function(event) {
    var message = event.data;
    
    //debug('got message', message.type, message.data);

    if (message.type == 'addedCrowdAgent') debug('got message', message.type, message.data);

    if (this[message.type]) {
      this[message.type](message.data);
    }
    if (message.cb) {
      self._callbacks[message.cb](message.data);
      setTimeout(function(){ delete self._callbacks[message.cb]; }, 10 * 60 * 1000);
    }
  };
}

Pathfinding.prototype.cb = function(funct) {
  if (typeof funct !== 'function') { return funct; }
  var tmpname = '__tmp_' + parseInt(Math.random() * 10000000, 0);
  this._callbacks[tmpname] = funct;
  return tmpname;
};

Pathfinding.prototype.config = function(config, callback) {
  this.worker.postMessage({
    cb: this.cb(callback),
    type: 'config',
    data: config
  });
};

Pathfinding.prototype.ready = function() {
  debug('Pathfinding worker ready');
};

Pathfinding.prototype.initWithFile = function(data, callback) {
  this.worker.postMessage({
    cb: this.cb(callback),
    type: 'initWithFile',
    data: data
  });
};

Pathfinding.prototype.initWithFileContent = function(data, callback) {
  this.worker.postMessage({
    cb: this.cb(callback),
    type: 'initWithFileContent',
    data: data
  });
};

Pathfinding.prototype.getRandomPoint = function(callback) {
  this.worker.postMessage({
    cb: this.cb(callback),
    type: 'getRandomPoint'
  });
};

Pathfinding.prototype.setPolyUnwalkable = function(position, radius, flags, callback) {
  this.worker.postMessage({
    cb: this.cb(callback),
    type: 'setPolyUnwalkable',
    data: { sx:position.x, sy:position.y, sz:position.z, dx:radius.x, dy:radius.y, dz:radius.z, flags:flags }
  });
};

Pathfinding.prototype.findPath = function(sx, sy, sz, dx, dy, dz, max, callback) {
  this.worker.postMessage({
    cb: this.cb(callback),
    type: 'findPath',
    data: { sx:sx, sy:sy, sz:sz, dx:dx, dy:dy, dz:dz, max:max }
  });
};

Pathfinding.prototype.addCrowdAgent = function(options, callback) {
  this.worker.postMessage({
    cb: this.cb(callback),
    type: 'addCrowdAgent',
    data: options
  });
};

Pathfinding.prototype.updateCrowdAgentParameters = function(agent, options) {
  this.worker.postMessage({
    type: 'updateCrowdAgentParameters',
    data: {
      agent: agent,
      options: options
    }
  });
};

Pathfinding.prototype.removeCrowdAgent = function(agent) {
  this.worker.postMessage({
    type: 'removeCrowdAgent',
    data: agent
  });
};

Pathfinding.prototype.crowdUpdate = function(delta, callback) {
  this.worker.postMessage({
    cb: this.cb(callback),
    type: 'crowdUpdate',
    data: delta
  });
};

Pathfinding.prototype.crowdRequestMoveTarget = function(agent, position) {
  this.worker.postMessage({
    type: 'crowdRequestMoveTarget',
    data: { agent:agent, x:position.x, y:position.y, z:position.z }
  });
};


