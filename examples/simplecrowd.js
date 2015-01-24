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

var ogro;

arena.on('set:terrain', function(){

  arena.addCharacter(function(done){
    ogro = new Arena.Characters.Ogro({
      onLoad: function(){
        arena.asPlayer(this);
        done(this);
      }
    });
  });

  for (var i = 0; i < 10; i++) {
    arena.randomPositionOnterrain(function(point){
      arena.addCharacter(function(done){
        new Arena.Characters.Monsterdog({
          onLoad: function(){
            var monster = this;
            this.position.copy(point);
            this.scale.set(0.5, 0.5, 0.5);
            done(monster);

            setTimeout(function(){
              monster.emit('follow', ogro);
            }, 5000);
          }
        });
      });
    });
  }

});

arena.init(function(arena){
  arena.run();
});
