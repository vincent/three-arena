'use strict';

module.exports = Pathfinding;

function Pathfinding (game) {

  var self = this;
  
  this.game = game;
  this.worker = new Worker('../lib/pathfinding/recast.worker.js');

  this._callbacks = {};

  this.worker.onmessage = function(event) {
    console.log('from worker', event.data);
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
  var cb = this.cb(callback);
  this.worker.postMessage({
    cb: cb,
    type: 'config',
    data: config
  });
};

Pathfinding.prototype.ready = function() {
  console.log('Pathfinding worker ready');
};

Pathfinding.prototype.initWithFileContent = function(data, callback) {
  console.log({
    cb: this.cb(callback),
    type: 'initWithFileContent',
    data: data
  });
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

Pathfinding.prototype.path = function(data) {
  console.log('in main response !');
  console.log(data);
};


