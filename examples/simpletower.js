var arena =  new Arena({
  container: document.getElementById('game-container')
});

arena.setTerrain('/gamedata/maps/simplest/simplest.obj', {
  wireframe: true,
  tDiffuse: '/gamedata/textures/plain_blue.png',
  tNormal: '/gamedata/textures/plain_blue.png'
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

arena.addStatic(function(done){
  var defenseTower = new Arena.Elements.DefenseTower(0, 5, 1, {
    fireSpeed: 10,
    fireIntensity: 100,
    minRange: 20,
    maxRange: 40
  });
  done(defenseTower);
});

arena.init(function(arena){
  arena.start();
});

