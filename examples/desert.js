'use strict';

var Arena = window.Arena;

var arena = window.arena = new Arena({
  container: document.getElementById('game-container'),

  showRoutes: true,

  lightAmbientColor: '#2b2b46',
  lightPointColor: '#deaa4c',
  lightPointIntensity: 2.5,

});

arena.setTerrain('/gamedata/sandbox/desert.obj', {
  minimap: '/gamedata/maps/simplest/minimap.png',

  cellSize: 0.2,          // nav mesh cell size (.8 > 2)
  cellHeight: 0.5,        // nav mesh cell height (.5 > 1)
  agentHeight: 2.0,       // character height (1.2 => 2)
  agentRadius: 0.6,       // character radius (.5 > 2)
  agentMaxClimb: 1.0,     // max units character can jump (1 > 5)
  agentMaxSlope: 20.0,    // max degre character can climb (20 > 40)
});

/* */
arena.addCharacter(function(done){
  new Arena.Characters.Ogro({
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
