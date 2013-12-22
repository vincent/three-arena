define('threearena/examples/simpletower',
['lodash', 'threejs', 'threearena/game', 'threearena/character/ogro', 'threearena/elements/tower', 'threearena/spell/firebullet'],

function(_, THREE, Arena, Ogro, DefenseTower, FireBulletSpell) {

  return new Arena({
      container: document.getElementById('game-container'),
      splashContainer: document.getElementById('splash-container'),
    })

    .setTerrain('/gamedata/maps/simplest.obj', {
      wireframe: true,
      tDiffuse: '/gamedata/textures/plain_blue.jpg',
      tNormal: '/gamedata/textures/plain_blue.jpg'
    })

    .addCharacter(function(done){
      new Ogro({
        onLoad: function(){
          var character = this;
          character.learnSpell(FireBulletSpell);
          done(character);
        }
      });
    })
    
    .addStatic(function(done){
      var defenseTower = new DefenseTower(0, 5, 1, {
          fireSpeed: 10,
          fireIntensity: 100,
          minRange: 20,
          maxRange: 40
      });
      done(defenseTower);
    });
});
