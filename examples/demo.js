'use strict';


var arena = new Arena({

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

arena.setTerrain('/gamedata/maps/mountains.obj', {
  map: THREE.ImageUtils.loadTexture('/gamedata/dota_map_full_compress3.jpg'),
  bumpMap: THREE.ImageUtils.loadTexture('/gamedata/dota_map_full_compress3.jpg'),
  bumpScale: 0.005,
});


var objective1 = new Arena.Elements.Nexus({ life: 1000000, color: '#F33' }),
    objective2 = new Arena.Elements.Nexus({ life: 1000000, color: '#3F3' });

arena.addStatic(function(done){
  
  objective1.position.set(-71.2, 19, 69);
  // arena.intersectObjects.push(objective1);
  done(objective1);
});

arena.addStatic(function(done){
  
  objective2.position.set(89.2, 21, -62.5);
  // arena.intersectObjects.push(objective2);
  done(objective2);
});


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


/* / Some flies
arena.on('set:terrain', function(){
  arena.addStatic(function (done) {
    var flies = new Arena.Elements.Flies(10);
    arena.randomPositionOnterrain(function(point){
      flies.position.copy(point);
      arena.on('update', _.bind(flies.update, flies));
      done(flies);
    });
  });
});
/* */


// A state Machine 
var machine = new Machine();        


// Another character
arena.addCharacter(function(done){
  var ogro = new Arena.Characters.OO7({
    onLoad: function(){
      var character = this;

      character.state.team = 0;

      character.behaviour = machine.generateTree(Arena.Behaviours.Controlled, character, character.states);
      arena.on('update:behaviours', function () {
        // character.behaviour = character.behaviour.tick();
      });

      // learn some spells
      character.learnSpell( Arena.Spells.FireAura );
      character.learnSpell( Arena.Spells.FireBullet );
      character.learnSpell( Arena.Spells.FlatFireAura );
      character.learnSpell( Arena.Spells.Lightbolt );

      character.position.copy(arena.settings.positions.nearcamp);

      arena.asPlayer(character);

      done(character);
    }
  });
});

// A spawning pool
var pool = new Arena.Elements.SpawningPool({
  entity: Arena.Characters.Monsterdog,
  groupOf: 1,
  eachGroupInterval: 30 * 1000
});
pool.on('spawnedone', function (character) {
  character.state.team = 1;
  character.learnSpell(Arena.Spells.Bite);
  character.state.autoAttacks = true;
  character.state.autoAttackSpell = 0;

  character.objective = objective1;
  character.behaviour = machine.generateTree(Arena.Behaviours.Minion, character, character.states);
  arena.on('update:behaviours', function() {
    character.behaviour = character.behaviour.tick();
  });
});
pool.position.copy(objective2.position);
arena.on('start', function () {
  pool.start();
});
arena.addSpawningPool(pool);



arena.init(function(arena){
  arena.start();
});

