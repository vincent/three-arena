Three Arena
===

> A Dota-like game experiment

Main game codebase
===

/game
====


/elements/tower
====
```javascript
var defenseTower = new DefenseTower( x, y, z, {
    fireSpeed: 1,
    bulletSpeed: 1
});
scene.add( defenseTower );
```


/particles/cloud
====
```javascript
var aura = Particles.Aura( 'point', fireIntensity, orbTexture, null );
aura.particleCloud.position.set( x, y, z );
scene.add( aura );
```

```javascript
var aura = Particles.Aura( 'point', self.options.fireIntensity, self.options.orbTexture, null );
aura.particleCloud.position.set( x, y, z );
scene.add( aura );
```

