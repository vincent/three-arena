'use strict';

module.exports = Pathfinding;

function Pathfinding (game) {

  var self = this;
  
  this.game = game;
  this.worker = new Worker('../lib/pathfinding/recast.worker.js');

  this._callbacks = {};

  this.worker.onmessage = function(event) {
    var message = event.data;
    if (this[message.type]) {
      this[message.type](message.data);
    }
    if (message.cb) {
      self._callbacks[message.cb](message.data);
      delete self._callbacks[message.cb];
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
  console.log('Pathfinding worker ready');
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


