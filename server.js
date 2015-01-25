var _       = require('lodash');
var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);

app.use(express.static(__dirname));


///////////////////////////////////

var PLAYER_POSITIONS = {

};

///////////////////////////////////

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('target', function(data){
    console.log('a user heads to', data);
  });

  socket.on('move', function(data, name){
    // console.log(socket.id, '(', name, ')', 'is at', data);
    PLAYER_POSITIONS[name] = data;
  });

  setInterval(function () {
    socket.broadcast.emit('players positions', PLAYER_POSITIONS);
  }, 200);

  setInterval(function () {
    console.log(_.size(PLAYER_POSITIONS), 'players online');
  }, 10000);

});


http.listen(8081, function(){
  console.log('listening on *:8081');
});
