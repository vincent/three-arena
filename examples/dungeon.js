'use strict';

var Arena = window.Arena;

var arena = new Arena({
  container: document.getElementById('game-container'),
  splashContainer: document.getElementById('splash-container'),

  showRoutes: true,
  showObstacles: true
});

var terrainTexture = THREE.ImageUtils.loadTexture('/gamedata/maps/dungeon/mtl_floor03_s.jpg');
terrainTexture.wrapS = terrainTexture.wrapT = THREE.RepeatWrapping;
terrainTexture.repeat.set( 2, 2 );

arena.setTerrain('/gamedata/maps/dungeon/dungeon_noised.obj', {
  map: terrainTexture,
});

arena.addCharacter(function(done){
  new Arena.Characters.Ogro({
    onLoad: function(){
      var character = this;
      character.learnSpell(Arena.Spells.FireBullet);
      arena.asPlayer(this);
      done(character);
    }
  });
});

arena.on('set:terrain', function(){

  // A shop
  arena.randomPositionOnterrain(function(point){
    var shop = new Arena.Elements.Shop({ menu: { items: [
      { action: 'sell', name: 'Potion', price: 20 }
    ] } });
    shop.position.copy(point);
    arena.addInteractive(shop);
  });

  /* / Some flies
  for (var i = 0; i < 200; i++) {
    arena.addStatic(function (done) {
      var flies = new Flies(10);
      arena.randomPositionOnterrain(function(point){
        flies.position.copy(point);
        arena.on('update', _.bind(flies.update, flies));
        done(flies);
      });
    });
  }
  /* */
  
});


$('#loading-bar .progress').show();

arena.init(function(arena){
  arena.preload(
    function(){
      setTimeout(function(){ arena.start(); }, 500);
    },
    function(complete, total){
      $('#loading-bar .progress').css('width', (98 / total * complete) + '%' );
    }
  );
});
