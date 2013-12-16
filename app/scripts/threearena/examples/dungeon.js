define('threearena/examples/dungeon',
['lodash', 'threejs', 'threearena/game', 'threearena/character/ogro', 'threearena/spell/firebullet', 'threearena/particles/flies', 'threearena/elements/shop'],

function(_, THREE, Arena, Ogro, FireBulletSpell, Flies, Shop) {

  var arena = new Arena({
      container: document.getElementById('game-container'),
      splashContainer: document.getElementById('splash-container'),

      showRoutes: true,
      showObstacles: true
    })

    .setTerrain('/gamedata/maps/dungeon/dungeon_noised.obj', {
      tDiffuse: '/gamedata/maps/dungeon/mtl_floor03_s.png',
      tNormal: '/gamedata/textures/plain_blue.png'
    })

    .addCharacter(function(done){
      new Ogro({
        onLoad: function(){
          var character = this;
          character.learnSpell(FireBulletSpell);
          done(character);
        }
      });
    });

  arena.bind('set:terrain', function(){

    // A shop
    arena.randomPositionOnterrain(function(point){
      var shop = new Shop({ menu: { items: [
        { action: 'sell', name: 'Potion', price: 20 }
      ] } });
      shop.position.copy(point);
      arena.addInteractive(shop);
    });

    // Some flies
    for (var i = 0; i < 200; i++) {
      arena.addStatic(function (done) {
          var flies = new Flies(10);
          arena.randomPositionOnterrain(function(point){
              flies.position.copy(point);
              arena.bind('update', _.bind(flies.update, flies));
              done(flies);
          });
      });
    }
  });

  return arena;

});
