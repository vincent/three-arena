'use strict';

var Arena = window.Arena;

var arena = window.arena = new Arena({
  container: document.getElementById('game-container'),

  lightAmbientColor: '#000000',
  lightPointColor: '#2aac8d',
  lightPointIntensity: 0.5,

  lightPointOffset: {
    x: 0,
    y: 0,
    z: 0
  },

});

arena.setTerrain('/gamedata/sandbox/obstacles.obj', {
  minimap: '/gamedata/maps/simplest/minimap.png',

  cellSize: 0.9,          // nav mesh cell size (.8 > 2)
  cellHeight: 0.8,        // nav mesh cell height (.5 > 1)
  agentHeight: 2.0,       // character height (1.2 => 2)
  agentRadius: 0.8,       // character radius (.5 > 2)
  agentMaxClimb: 1.0,     // max units character can jump (1 > 5)
  agentMaxSlope: 50.0,    // max degre character can climb (20 > 40)

});

arena.on('set:terrain', function(){
  arena.init(function(arena){

    arena.addCharacter(function(done){
      new Arena.Characters.Dummy({
        radius: 1.5,
        maxSpeed: 10.0,
        onLoad: function(){
          this.learnSpell(Arena.Spells.Teleport);
          arena.asPlayer(this);
          this.steerings.currently('seek', true);
          done(this);
        }
      });
    });

    arena.addCharacter(function(done){
      new Arena.Characters.Dummy({
        radius: 1.5,
        maxSpeed: 5.0,
        onLoad: function(){
          // this.steerings.currently('wander', true);
          done(this);

          var self = this;
          setTimeout(function () {
            self.setTarget(arena.entity);
            self.steerings.currently('hide', true);
          }, 2000);
        }
      });
    });

    arena.run();
  });
});
