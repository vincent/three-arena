'use strict';

var Arena = window.Arena;

var arena = window.arena = new Arena({
  container: document.getElementById('game-container'),

  showRoutes: true,

  lightAmbientColor: 0xa0a0a0,
  lightPointColor: 0xa0a0a0,
  lightPointIntensity: 2.5,

});

arena.setTerrain('/gamedata/maps/simplest/simplest.obj', {
  minimap: '/gamedata/maps/simplest/minimap.png',

  cellSize: 0.5,          // nav mesh cell size (.8 > 2)
  cellHeight: 0.8,        // nav mesh cell height (.5 > 1)
  agentHeight: 2.0,       // character height (1.2 => 2)
  agentRadius: 0.6,       // character radius (.5 > 2)
  agentMaxClimb: 1.0,     // max units character can jump (1 > 5)
  agentMaxSlope: 40.0,    // max degre character can climb (20 > 40)
});

/* */
arena.addCharacter(function(done){
  new Arena.Characters.Zombie({
    onLoad: function(){
      this.learnSpell(Arena.Spells.Teleport);
      arena.asPlayer(this);
      done(this);
    }
  });
});
/* */

arena.on('set:terrain', function(){

  /* */
  arena.addStatic(function(done){
    var object = new Arena.Elements.Spikes({
      onLoad: function(){
        arena.randomPositionOnterrain(function(point){
          object.position.copy(point);
          done(object);
        });
      }
    });
  });
  /* */

  /* */
  arena.addStatic(function(done){
    var object = new Arena.Elements.Checkpoint({
      onLoad: function(){
        arena.randomPositionOnterrain(function(point){
          object.position.copy(point);
          done(object);
        });
      }
    });
  });
  /* */

  arena.init(function(arena){
    arena.run();
  });
});
