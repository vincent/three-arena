
var inherits = require('inherits');
var socket = require('socket.io-client');
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


    // wrap Socket.IO

    // var emit = socket.emit;
    // socket.emit = function() {
    //     self.emit.apply(socket, arguments);
    //     emit.apply(socket, arguments);
    // };

    // var $emit = socket.$emit;
    // socket.$emit = function() {
    //     self.on.apply(socket, arguments);
    //     $emit.apply(socket, arguments);
    // };
}

inherits(Network, EventEmitter);


Network.prototype.send = function(type, data) {

    this.io.emit.apply(this.io, Array.prototype.slice.call(arguments));
};

