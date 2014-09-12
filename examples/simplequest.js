'use strict';

var Arena = window.Arena;

var arena = window.arena = new Arena({
  container: document.getElementById('game-container'),

  lightAmbientColor: '#343434',
  lightPointColor: '#2aac8d',
  lightPointIntensity: 1.5,

});

arena.setTerrain('/gamedata/maps/simplest/flat.obj', {
  minimap: THREE.ImageUtils.loadTexture('/gamedata/maps/simplest/minimap.png'),

  cellSize: 0.9,          // nav mesh cell size (.8 > 2)
  cellHeight: 0.8,        // nav mesh cell height (.5 > 1)
  agentHeight: 2.0,       // character height (1.2 => 2)
  agentRadius: 0.8,       // character radius (.5 > 2)
  agentMaxClimb: 1.0,     // max units character can jump (1 > 5)
  agentMaxSlope: 50.0,    // max degre character can climb (20 > 40)
});

arena.addCharacter(function(done){
  new Arena.Characters.Dummy({
    name: 'The young',
    maxSpeed: 15.0,
    onLoad: function(){
      this.learnSpell(Arena.Spells.Teleport);
      arena.asPlayer(this);
      done(this);
    }
  });
});

arena.addCharacter(function(done){
  new Arena.Characters.Dummy({
    name: 'The elder',
    maxSpeed: 15.0,
    onLoad: function(){
      done(this);
    }
  });
});

arena.on('set:terrain', function(){
  arena.init(function(arena){
    arena.run();
  });
});

arena.addQuest({
  id: 1,
  title: 'A brave new world',
  steps: [
    {'The elder': {
      dialog1: {
        text: "Hello stranger,\nI'm Pedro The Elder\nDo you feel ... adventurous ?\n",
        choices: {
          'Yes': 'dialog2',
          'No': 'kthxbye'
        }
      },
      dialog2: {
        text: "Ho.. I see... but aren't you too young for an adventure ?\n",
        choices: {
          'Maybe': 'kthxbye',
          'No !': function () {
            alert('Go up north !');
          }
        }
      },
      kthxbye: {
        text: "Well... see you then...\n",
        choices: {
          'Bye': 'end'
        }
      }
    }}
  ]
});

arena.quests.syncAvailableQuests();
