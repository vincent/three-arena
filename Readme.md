<!-- title: Three Arena -->
<!-- subtitle: A WebGL game engine -->

Three Arena
===

http://three-arena.com/examples/#simplest.js

Three Arena is an opiniated WebGL game framework to create 3D hack-and-slash games in an HTML context. It uses [three.js](http://threejs.org) 3D engine, [machinejs](http://machinejs.maryrosecook.com) behaviour trees, [recastnavigation](https://github.com/memononen/recastnavigation) pathfinding system, [knockoutjs](http://knockoutjs.com) dom binding system and [other](three-arena/blob/master/bower.json) open source projects.


Features
===

* click-to-move on any .obj mesh object with an easy pathfinding system
* use your level geometry file directly, or load a custom navigation mesh
* single unit control
* mouse & arrow keys camera behaviour
* customizable HTML & CSS for HUD
* customizable scene objects interactive menus (shops, ...) 
* generic character model system, works well with converted MD2 (Quake) files
* characters behaviours
 - attack when enemmy in sight
 - move to a greater objective)
* spells with 3d fx, min-max distance, cooldown
* spatial sound effects
* built-in common 3D game objects
 - Flies
 - Water
* built-in common RPG components
 - Defense Tower
 - Shop
 - Spawning pool
* game interaction through events
 - `game.on('start', function)`
 - `game.on('set:terrain', function)`
 - `game.on('added:character', function)`
 - `character.on('hit', function)`
 - `character.on('death', function)`
 - and many others..
* You have a super fun idea ? Great !
 - add it as a [ticket](https://github.com/vincent/three-arena/issues)
 - you can code it ? send a pull request from master branch !


Not ready (yet)
===
 * multiplayer game server
 * collisions system


Examples
===

Some examples here [three-arena.com/examples](http://three-arena.com/examples)

Or run ```npm install && npm start``` from the project root.

<pre>
  new Arena({
    container: 'game-container', // the container DOM ID

    cameraHeight: 80,

    fog: { near: 20, far: 250 }, // configure fog
  })

  .setTerrain('/gamedata/maps/simplest.obj', { // use this .OBJ as terrain

    map: '/path/to/terrain/texture.png' // the terrain texture

    // other material options, like bumpMap, wireframe, etc..
  })

  .addCharacter(function(done){ // add a character

    new Arena.Characters.Ogro({

      name: 'Shrek', // the character name

      image: '/gamedata/unknown.png', // its portrait

      tomb: '/gamedata/models/rts_elements.dae', // use this model when it dies

      life: 100, // start with 100 life points

      onLoad: function(){

        this.learnSpell(Arena.Spells.FireBullet); // learn a spell

        done(this); // on scene !
      }
    });
    
  });
</pre>

Show me the code
===

* The main game code is in [lib/index.js](index.js)
* Character class is in [lib/character.js](lib/character.js)
* A spell example is in [lib/spell/bite.js](lib/spells/bite.js)


Hack the pathfinding system
===

The pathfinding is done via an javascript Emscripten-compiled interface above the c++ library [recastnavigation](https://github.com/memononen/recastnavigation).
To add methods in this module, you need to code their [javascript interface](recastnavigation/emscripten/js_interface/main.cpp#L966) and rebuild the javascript module with
```sh
npm run recast
```

Or build a separated build with
```sh
cd recastnavigation/emscripten
./build.sh ../../lib/pathfinding/recast.js
```



