
var arena = new Arena({
  container: document.getElementById('game-container'),
  splashContainer: document.getElementById('splash-container'),

  showRoutes: true,
  showObstacles: true
});

arena.setTerrain('/gamedata/maps/dungeon/dungeon_noised.obj', {
  tDiffuse: '/gamedata/maps/dungeon/mtl_floor03_s.png',
  tNormal: '/gamedata/textures/plain_blue.png'
});

arena.addCharacter(function(done){
  new Arena.Characters.Ogro({
    onLoad: function(){
      var character = this;
      character.learnSpell(Arena.Spells.FireBullet);
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

