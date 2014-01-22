'use strict';

var Arena = window.Arena;

var arena = window.arena = new Arena({
  container: document.getElementById('game-container'),

  lightAmbientColor: 0x0F0808,
  lightPointColor: 0x5F4444,
  lightDirectionalColor: 0xffffff,
});

arena.setTerrain('/gamedata/maps/simplest/flat.obj', {
  map: THREE.ImageUtils.loadTexture('/gamedata/textures/grass.jpg'),
});


arena.on('set:terrain', function(){

  arena.addStatic(function(done){
    var cc = new Arena.Elements.CommandCenter({
      onLoad: function(){
        done(cc);
      }
    });
  });

  for (var i = 0; i < 10; i++) {
    arena.addStatic(function(done){
      var collectible = new Arena.Elements.Mineral({
        amount: 50,
        onLoad: function(){
          arena.randomPositionOnterrain(function(point){
            collectible.position.copy(point);
            done(collectible);
          });
        }
      });
    });
  }

  for (var i = 0; i < 1; i++) {
    arena.addCharacter(function(done){
      arena.randomPositionOnterrain(function(point){
        new Arena.Characters.Ogro({
          onLoad: function(){
            this.behaviour = Arena.Behaviours.Collector;
            this.position.copy(point);
            if (!arena.entity) { arena.asPlayer(this); }
            done(this);
          }
        });
      });
    });
  }

  arena.init(function(arena){
    arena.run();
  });
});
