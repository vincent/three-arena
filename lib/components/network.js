'use strict'

var _            = require('lodash');
var socket       = require('socket.io-client');
var EventEmitter = require('EventEmitter');

module.exports = Network;

function Network (arena) {

  EventEmitter.apply(this);

  var io = socket();

  io.on('connection', function(socket){

  });

  io.on('players positions', function (playersPositions) {
    arena.syncNetworkPlayersPositions(playersPositions);
  });

  function send (type, data) {
    io.emit.apply(io, Array.prototype.slice.call(arguments));
  }

  function syncEntityPosition() {
    if (arena.entity) {
      var p = arena.entity.position;
      send('move', { x:p.x, y:p.y, z:p.z }, arena.entity.state.name);
    }
  }

  arena.on('update', _.throttle(syncEntityPosition, 200));
}

