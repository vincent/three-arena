'use strict';

/* global _ */

var Arena = window.Arena;

var arena = window.arena = new Arena({
  container: document.getElementById('game-container'),

  showRoutes: true,
  showTrails: true
});

arena.setTerrain('/gamedata/maps/xelnaga/caverneXELNAGA4.obj', {
  minimap: THREE.ImageUtils.loadTexture('/gamedata/maps/xelnaga/xelnaga4.png'),
  map: THREE.ImageUtils.loadTexture('/gamedata/maps/xelnaga/xelnaga4.png'),
  // bumpMap: THREE.ImageUtils.loadTexture('/gamedata//maps/dota/dota_map_full_compress3.jpg'),
  // bumpScale: 0.005,
});

var player;
var dogs = [];

// select mode to activate [ objective, follow, follow_on_sight ]
// predefined positions on change

var modes = {

  'go away': function(){
    $.each(dogs, function(i, dog){
      // hide sight
      arena.randomPositionOnterrain(function(point){
        dog.emit('destination', { position: new THREE.Vector3(point.x, point.y, point.z) });
      });
    });
  },

  objective: function(){
    $.each(dogs, function(i, dog){
      // hide sight
      dog.emit('destination', { position: player.position.clone() });
    });
  },

  follow: function(){
    $.each(dogs, function(i, dog){
      // hide sight
      dog.emit('follow', player);
    });
  },

  follow_on_sight: function(){
    $.each(dogs, function(i, dog){
      // show sight
      dog.emit('nodestination', player);
    });
  }

};

if (arena.gui) {
  var gui = arena.gui.addFolder('Pursuits');
  gui.add(modes, 'go away');
  gui.add(modes, 'objective');
  gui.add(modes, 'follow');
  // gui.add(modes, 'follow_on_sight');
}

arena.on('set:terrain', function(){

  arena.loadCharacter(Arena.Characters.Ogro, function(done){
    player = this;
    player.position.set(-81.870, 0.000, 350.338);
    arena.asPlayer(player);
    player.state.team = 0;
    // learn some spells
    player.learnSpell(Arena.Spells.Teleport);
    player.learnSpell(Arena.Spells.FireBullet);
    done(player);
  });

  for (var i = 0; i < 5; i++) {
    arena.randomPositionOnterrain(function(point){
      arena.loadCharacter(Arena.Characters.Dummy, function(done){
        var monster = this;
        dogs.push(this);
        this.position.copy(point);
        this.scale.set(0.5, 0.5, 0.5);
        done(monster);
      });
    });
  }

});

arena.init(function(arena){
  arena.run();
});
