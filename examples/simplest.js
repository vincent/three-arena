'use strict';

var Arena = window.Arena;

var arena = new Arena({
  container: document.getElementById('game-container'),

  showRoutes: true
});

arena.setTerrain('/gamedata/maps/simplest/simplest.obj', {
  minimap: '/gamedata/maps/simplest/minimap.png'
});

arena.addCharacter(function(done){
  new Arena.Characters.Ogro({
    onLoad: function(){
      arena.asPlayer(this);
      done(this);
    }
  });
});

arena.init(function(arena){
  arena.start();
});
