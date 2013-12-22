
arena = new Arena({
  container: document.getElementById('game-container'),

  showRoutes: true
});

arena.setTerrain('/gamedata/maps/test.obj', {
  map: THREE.ImageUtils.loadTexture('/gamedata/maps/dungeon/mtl_floor03_s.png'),
  bumpMap: THREE.ImageUtils.loadTexture('/gamedata/maps/dungeon/mtl_floor03_s.png'),
  bumpScale: 0.005,
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

arena.init(function(arena){
  arena.start();
});
