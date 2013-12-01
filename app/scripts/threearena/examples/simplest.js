define('threearena/examples/simplest',
['lodash', 'threejs', 'threearena/game', 'threearena/character/ogro', 'threearena/spell/firebullet'],

function(_, THREE, Game, Ogro, FireBulletSpell) {

  return new Game({
      container: document.getElementById('game-container'),
      splashContainer: document.getElementById('splash-container'),

      showRoutes: true
    })
    .setTerrain('/gamedata/maps/simplest.obj', {
      wireframe: true,
      tDiffuse: '/gamedata/textures/plain_blue.png',
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
});
