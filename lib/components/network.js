var _            = require('lodash');
var settings     = require('../settings');
var socket       = require('socket.io-client');
var EventEmitter = require('EventEmitter');

module.exports = Network;

function Network (arena) {

  var self = this;

  EventEmitter.apply(this);

  this.io = socket();

  this.io.on('connection', function(socket){

  });

  this.io.on('players positions', function (playersPositions) {
    arena.syncNetworkPlayersPositions(playersPositions);
  });


  function syncEntityPosition() {
    if (arena.entity) {
      var p = arena.entity.position;
      network.send('move', { x:p.x, y:p.y, z:p.z }, arena.entity.state.name)
    }
  }

  arena.on('update', _.throttle(syncEntityPosition, 200));
}

Network.prototype.send = function(type, data) {

  this.io.emit.apply(this.io, Array.prototype.slice.call(arguments));
};

