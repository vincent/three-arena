'use strict';

var Arena = window.Arena;

var arena = window.arena = new Arena({

  container: document.getElementById('game-container'),

  cameraFollowsPlayer: true,
  visibleCharactersBBox: false,

  lights: {
    ambientColor: 0x646464,
    pointColor: 0x786D53,
    directionalColor: 0x2F1717
  },

  positions: {
    spawn: new THREE.Vector3( 0, 0, 0 ),
    origin: new THREE.Vector3( 0, 0, 0 ),
    maporigin: new THREE.Vector3( -142, 0, 139 ),
    neartower: new THREE.Vector3(  -51, 14, 62 ),
    nearcamp: new THREE.Vector3( -78.2, 15.5, 100 ),
  }
});

arena.on('set:lights', function () {
  arena.pointLight.intensity = 3.6;
  arena.pointLight.exponent = 25;
  arena.directionalLight.intensity = 0.7;
});

arena.setTerrain('/gamedata/maps/dota/mountains.obj', {
  minimap: THREE.ImageUtils.loadTexture('/gamedata/maps/dota/dota_map_full_compress3.jpg'),
  map: THREE.ImageUtils.loadTexture('/gamedata/maps/dota/dota_map_full_compress3.jpg'),
  // bumpMap: THREE.ImageUtils.loadTexture('/gamedata//maps/dota/dota_map_full_compress3.jpg'),
  // bumpScale: 0.005,
});


var objective1 = new Arena.Elements.Nexus({ life: 1000000, color: '#F33' }),
    objective2 = new Arena.Elements.Nexus({ life: 1000000, color: '#3F3' });

objective1.dialog = {

};

arena.addStatic(function(done){

  objective1.state.isStatic = true;
  objective1.isBlocking = 5.0;
  objective1.state.team = 0;
  objective1.position.set(-71.2, 19, 69);
  done(objective1);
});

arena.addStatic(function(done){

  objective2.state.isStatic = true;
  objective2.isBlocking = 5.0;
  objective2.state.team = 1;
  objective2.position.set(89.2, 21, -62.5);
  done(objective2);
});

/* * /
arena.addStatic(function(done){

  // Add a particle system
  var bullet_particles = new Arena.stemkoski.ParticleEngine();
  bullet_particles.setValues( Arena.stemkoski.Examples.fireball);
  bullet_particles.initialize();

  arena.on('update', function(arena){
    bullet_particles.update(arena.delta);
  });

  done(bullet_particles.particleMesh);

});
/* */

// A shop
var shop = new Arena.Elements.Shop({
  menu: {
    items: [
      { action: 'sell', name: 'Potion', price: 20 }
    ]
  }
});
shop.position.set( -99, 15, 94 );
arena.addInteractive(shop);


// Some flies
arena.on('set:terrain', function(){

  /* */
  // Add some trees
  var trees = new Arena.Elements.MergedTrees();
  for (var i = 0; i < 100; i++) {
    (function (i) {
      new Arena.Elements.Tree({
        onLoad: function(){
          var tree = this;
          arena.randomPositionOnterrain(function(x, y, z){
            tree.position.set(x, y, z);

            trees.merge(tree);
            if (i === 99) {
              debugger;
              arena.addStatic(trees);
            }
          });
        }
      });
    })(i);
  }
  /* */


  0 && arena.addStatic(function (done) {
    var flies = new Arena.Elements.Flies(10);
    arena.randomPositionOnterrain(function(x, y, z){
      flies.position.set(x, y, z);
      arena.on('update', flies.update.bind(flies));
      done(flies);
    });
  });

});


arena.on('set:terrain', function(){

  // Another character
  arena.addCharacter(function(done){
    var hero = new Arena.Characters.OO7({
      name: Arena.Account.username(),
      maxSpeed: 20.0,
      onLoad: function(){
        var character = this;
        character.state.team = 0;

        // character.behaviour = Arena.Behaviours.Controlled;

        character.state.autoAttacks = true;
        character.state.autoAttackSpell = 1;

        // learn some spells
        character.learnSpell(Arena.Spells.Teleport);
        character.learnSpell(Arena.Spells.FireBullet);
        // character.learnSpell(Arena.Spells.FireAura);
        character.learnSpell(Arena.Spells.Heal);
        // character.learnSpell(Arena.Spells.FlatFireAura);
        character.learnSpell(Arena.Spells.Lightbolt);

        // character.position.copy(arena.settings.positions.nearcamp);
        character.position.set(-15, 10, 80);

        arena.asPlayer(character);

        done(character);
      }
    });

    hero.on('death', function(){
      $('#deadscreen').show();
    });

  });

});

// A spawning pool
var pool = new Arena.Elements.SpawningPool({
  entity: Arena.Characters.Dummy,
  groupOf: 3,
  eachInterval: 1000,
  eachGroupInterval: 40 * 1000
});
pool.on('spawnedone', function (character) {
  character.state.team = 1;

  character.learnSpell(Arena.Spells.Bite);

  character.state.maxAcceleration = 1.0;
  character.state.maxSpeed = 2.0;

  character.state.autoAttacks = true;
  character.state.autoAttackSpell = 0;

  // character.position.set( 34.51927152670307, 16.415442854566393, -55.559584976370715 );
  character.position.set(
    objective2.position.x - 15,
    objective2.position.y,
    objective2.position.z + 15
  );

  character.objective = objective1;
  character.behaviour = Arena.Behaviours.Minion;

  arena.addCharacter(character);

  // character.emit('target', objective1);

});
pool.position.copy(objective2.position);
arena.on('start', function () {
  pool.start();
});
arena.addStatic(pool);

$('#loading-bar, #loading-bar .progress').show();

arena.once('set:terrain', function(){
  arena.init(function(arena){
    var completed = 0;
    arena.preload(
      function(){
        arena.run();
      },
      function(complete, total){
        if (complete >= total) {
          $('#loading-bar, #loading-bar .progress').hide();
        } else {
          completed++;
          $('#loading-bar .progress').css('width', (98 / total * completed) + '%' );
        }
      }
    );
  });
});
