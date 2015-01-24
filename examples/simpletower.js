'use strict';

var Arena = window.Arena;

var arena = window.arena = new Arena({
  container: document.getElementById('game-container')
});

arena.setTerrain('/gamedata/maps/simplest/simplest.obj', {
  wireframe: true,
  minimap: '/gamedata/textures/plain_blue.png'
});

arena.on('set:terrain', function(){

  arena.addCharacter(function(done){
    new Arena.Characters.Ogro({
      onLoad: function(){
        var character = this;
        arena.randomPositionOnterrain(function(point){
          character.position.set(16.116617015269746, 5.65605199999996, 7.858685651727598);
          //character.position.copy(point);
          character.learnSpell(Arena.Spells.FireBullet);
          arena.asPlayer(character);
          done(character);
        });
      }
    });
  });

  arena.addStatic(function(done){
    var defenseTower = new Arena.Elements.DefenseTower(0, 5, 1, {
      fireSpeed: 10,
      fireIntensity: 100,
      minRange: 20,
      maxRange: 40
    });
    done(defenseTower);
  });
});

arena.init(function(arena){
  arena.run();
});

