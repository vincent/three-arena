'use strict';

var Arena = window.Arena;

var arena = window.arena = new Arena({
  container: document.getElementById('game-container'),

  cameraType: 1
});

arena.setTerrain('/gamedata/maps/simplest/flat.obj', {
  map: THREE.ImageUtils.loadTexture('/gamedata/textures/grass.jpg'),
});

function newMinerals() {
  for (var i = 0; i < 10; i++) {
    arena.addStatic(function(done){
      var collectible = new Arena.Elements.Mineral({
        amount: 2 + Math.floor(Math.random()*10),
        onLoad: function(){
          arena.randomPositionOnterrain(function(point){
            collectible.position.copy(point);
            done(collectible);
          });
        }
      });
    });
  }
}

var buttonsDiv = $('<div style="position:absolute;top:100px;left:150px;width:200px;height:200px;"></div>');
$('#game-container').append(buttonsDiv);

var newMineralsBtn = $('<button>New minerals</button>');
newMineralsBtn.click(newMinerals);
buttonsDiv.append(newMineralsBtn);


arena.on('set:terrain', function(){

  arena.addStatic(function(done){
    var cc = new Arena.Elements.CommandCenter({
      // radius: 15.5,
      onLoad: function(){
        // cc.isBlocking = 1.0;
        done(cc);
      }
    });
  });

  var minerals = [
    {x: -48.14455584036541,   y: 0, z: -17.25699642573963 },
    {x: -33.981392409264075,  y: 0, z: -31.112812247947886},
    {x: -15.142587638708148,  y: 0, z: -41.331715312240675},
    {x: 4.609033740356873,    y: 0, z: -45.02141070585927 },
    {x: 24.579728666458024,   y: 0, z: -42.144643622817796},
    {x: 44.201530409972534,   y: 0, z: -31.11281224794476 },
    {x: 53.97607609351934,    y: 0, z: -16.908411450671395}
  ];
  for (var i = 0; i < minerals.length; i++) {
    arena.addStatic(function(done){
      var position = this;
      var collectible = new Arena.Elements.Mineral({
        amount: Math.floor(Math.random()*20),
        onLoad: function(){
          collectible.position.copy(position);
          done(collectible);
        }
      });
    }.bind(minerals[i]));
  }

  for (var i = 0; i < 10; i++) {
    arena.addCharacter(function(done){
      arena.randomPositionOnterrain(function(point){
        new Arena.Characters.SCV({
          radius: 2.0,
          onLoad: function(){
            this.behaviour = Arena.Behaviours.Collector;
            // this.position.copy(point);
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
