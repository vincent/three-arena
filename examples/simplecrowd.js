'use strict';

var Arena = window.Arena;

var arena = window.arena = new Arena({
  container: document.getElementById('game-container'),

  showRoutes: true
});

arena.setTerrain('/gamedata/maps/simplest/simplecross.obj', {
  minimap: {
    defaultmap: '/gamedata/maps/simplest/crowd_minimap_lvl1.png',
    'y >= 30': '/gamedata/maps/simplest/crowd_minimap_lvl2.png',
  }
});

arena.addCharacter(function(done){
  new Arena.Characters.Ogro({
    onLoad: function(){
      arena.asPlayer(this);
      done(this);
    }
  });
});

arena.on('set:terrain', function(){
  var crowd = new Arena.Elements.Crowd(arena);

  for (var i = 0; i < 10; i++) {
    arena.addCharacter(function(done){
      new Arena.Characters.Monsterdog({
        onLoad: function(){
          this.scale.set(.5, .5, .5);
          crowd.add(this, {
            radius: 4.0,
            position: { x:44.438741, y:0, z:-41.74593 },
            maxAcceleration: 30.0,
            maxSpeed: 15.0,
          });
          done(this);
        }
      });
    });
  }
});

arena.init(function(arena){
  arena.start();
});
