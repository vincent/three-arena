'use strict';

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

  function sendCastEvent (cast) {
    send(cast.type, {
      source: cast.spell.source ? cast.spell.source.state.name : null,
      target: cast.target ? cast.target.state.name : null,
      spell:  cast.spell.toEvent()
    });
  }

  function listenForCasts (entity) {
    entity.on('cast', sendCastEvent);

    function stopListenForCasts () {
      entity.off('cast', sendCastEvent);
    }

    entity.on('death', stopListenForCasts);
  }

  arena.on('update', _.throttle(syncEntityPosition, 200));

  arena.on('added:character', listenForCasts);

}

