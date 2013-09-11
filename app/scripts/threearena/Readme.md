Three Arena
===

> Main game codebase
> The project uses RequireJS, and define its modules as such

/threearena/game
====

The main game class, import meshes and effects in its scene, start the rendering.

```javascript
var g = new Game({
	container: document.getElementById( 'game-container' ),
	positions: {
	    spawn: new THREE.Vector3( 0, 0, 0 )
	},	
})
game.init()
game.start()
```

/threearena/log
====

The logging class. Will be used to display combat log and system messages.

```javascript
log( log.COMBAT, '%o killed %o', aCharacter, anotherCharacter )
```

/threearena/entity
====

A living entity, with a name, life and mana amount, attack power.
Can be a spell target, a selectable object, etc.
Usually you want to herit from this class.


/threearena/character
====

A playable character.


/threearena/elements/tower
====

A classic defense tower, attacking opponents characters in range.

```javascript
var defenseTower = new DefenseTower( x, y, z, {
    fireSpeed: 1,
    bulletSpeed: 1,
    orbTexture: tex1,
    fireTexture: tex2
})
scene.add( defenseTower )
```

/threearena/particles/cloud
====

A basic particle cloud system.

```javascript
var aura = Particles.Aura( 'point', fireIntensity, orbTexture, null )
aura.particleCloud.position.set( x, y, z )
scene.add( aura )
```


