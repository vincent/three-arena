Three Arena
===

Three Arena is an opiniated WebGL game framework to create 3D hack-and-slash games in an HTML context. It uses [three.js](http://threejs.org) 3D engine, [machinejs](http://machinejs.maryrosecook.com) behaviour trees, [recastnavigation](https://github.com/memononen/recastnavigation) pathfinding system, [knockoutjs](http://knockoutjs.com) dom binding system and [other](three-arena/blob/master/bower.json) open source projects.


Examples
===

Please run an http server in the ```examples``` directory to view examples.

```js

new Arena({

  container: 'game-container', // the container DOM ID

  cameraHeight: 80,

  fog: { near: 20, far: 250 }, // configure fog

  // debugging
  showRoutes: true, // show characters route paths
  visibleCharactersBBox: true // visible characters bounding box
  
})

.setTerrain('/gamedata/maps/simplest.obj', { // use this .OBJ as terrain

  tDiffuse: '/gamedata/textures/plain_blue.png' // the terrain texture
})

.addCharacter(function(done){ // add a character

  new Ogro({

    name: 'Shrek', // the character name

    image: '/gamedata/unknown.png', // its portrait

    tomb: '/gamedata/models/rts_elements.dae', // use this model when it dies

    life: 100, // start with 100 life points

    onLoad: function(){

      this.learnSpell(FireBulletSpell); // learn a spell

      done(this); // on scene !
    }
  });
  
});
```

Features
===

* click-to-move on a .obj mesh object
* single unit control
* mouse & arrow keys camera behaviour
* customizable HTML for HUD and scene objects (like shops) interactive menus
* generic character model system, works well with converted MD2 (Quake) files
* easy pathfinding system: use the terrain file, or load a custom navigation mesh
* spells with 3d fx, min-max distance, cooldown
* spatial sound effects
* built-in common 3D game objects: Flies, Water
* built-in common RPG components: Defense Tower, Shop
* game interaction with events
 - `game.on('start', function)`
 - `game.on('added:character', function)`
 - `character.on('hit', function)`
 - `character.on('death', function)`
 - and many others..
* You have a super fun idea ? Great !
 - add it as a [ticket](issues)
 - you can code it ? send me a pull request from master branch !


Show me the code
===

* The main game code is in [index.js](index.js)
* Character class is in [lib/character.js](lib/character.js)
* A spell example is in [lib/spells/bite.js](lib/spells/bite.js)


Hack the pathfinding system
===

The pathfinding is done via an javascript Emscripten-compiled interface above the c++ library [recastnavigation](https://github.com/memononen/recastnavigation).
To add methods in this module, you need to code their [javascript interface](recastnavigation/emscripten/js_interface/main.cpp) and rebuild the javascript module with

```sh
cd recastnavigation/emscripten
./build.sh ../../lib/pathfinding/recast.js
```



