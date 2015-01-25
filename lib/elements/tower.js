'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var TWEEN = require('tween');

var Spell = require('../spell');
var Entity = require('../entity');
var Particles = require('../particles/cloud');
var stemkoski = require('../particles/stemkoski_ParticleEngine');

module.exports = DefenseTower;

/**
 * @constructor
 * @exports threearena/elements/tower
 */
function DefenseTower ( x, y, z, options ) {

  THREE.Object3D.apply( this );

  var self = this;
  x = x ||  0;
  y = y || 28;
  z = z ||  1;
  options = options || {};

  this.bulletSpeed = options.bulletSpeed || 10;
  this.fireSpeed = options.fireSpeed || 1;

  this.magicLifeDamage = options.magicLifeDamage || 1;
  this.manaDamage = options.magicManaDamage || 1;

  /////

  this._firing = false;
  this._currentTweens = [];

  this.options = _.merge({
    start: true,
    minRange: 0,
    maxRange: 70,
    fireIntensity: 20000,
    orbTexture: options.texture || THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare1_alpha.png' ),
    fireTexture: options.texture || THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare0_alpha.png' ),
  } , options );

  // self.fireCloud = new ParticleCloud( 10000, self.options.fireTexture );

  var loader = new THREE.ColladaLoader();
  loader.load( '/gamedata/models/lantern/lantern.dae', function ( loaded ) {

    self.aura = new stemkoski.ParticleEngine();
    self.aura.setValues(stemkoski.Examples.fireball);

    self.add(self.aura.particleMesh);
    self.aura.particleMesh.position.set( x, y+28, z );

    var lantern = loaded.scene.children[ 0 ];
    lantern.castShadow = true;
    lantern.rotation.x = -90 * Math.PI / 180;
    lantern.scale.set(7, 7, 7);
    lantern.position.set(x, y, z);

    self.add(lantern);

    var selfUpdate = self.update.bind(self);

    if (self.options.start) {
      self.aura.initialize();

      window._ta_events.on('update', selfUpdate);
    }
  });
}

inherits(DefenseTower, THREE.Object3D);

DefenseTower.prototype.update = function(game) {

  var self = this;

  if (this.aura) {
    this.aura.update(game.delta);
  }

  if (this._firing) { return; }

  var i = -1, charDistance, minDistance = Number.MAX_VALUE, nearest = false;
  while (i++ < game.entities.length - 1 && !this._firing) {
    if (game.entities[i].isDead()) { continue; }

    charDistance = game.entities[i].position.distanceTo(self.position);
    if (charDistance >= self.options.minRange && charDistance < self.options.maxRange && charDistance < minDistance) {
      nearest = i;
      minDistance = charDistance;
    }
  }
  if (nearest !== false && ! this._firing) {
    self.fireTo( game.entities[ nearest ] );
  }
};

DefenseTower.prototype.stopFiring = function() {
  this._firing = false;
};

DefenseTower.prototype.fireTo = function(target) {

  if (this._firing || ! target instanceof Entity) { return; }

  this._firing = true;

  var startPosition = this.position.clone().setY(35);
  var vectorPosition = target.position.clone().add(startPosition).divideScalar(2).setY(28 + 0);

  var self = this;

  var line = new THREE.SplineCurve3([ startPosition, vectorPosition, target.position ]);

  var aura = new stemkoski.ParticleEngine();
  aura.setValues(stemkoski.Examples.fireball);
  aura.initialize();

  var cloudUpdate = function(game){
    aura.update(game.delta);
  };

  var tween = new TWEEN.Tween({ distance: 0 })

    .to({ distance: 1 }, line.getLength() * self.bulletSpeed)

    .easing(TWEEN.Easing.Quadratic.InOut)

    .onStart(function(){
      window._ta_events.on('update', cloudUpdate);

      self.add(aura.particleMesh);

      setTimeout(function(){
        self._firing = false;

      }, 4000 / self.fireSpeed);

      setTimeout(function(){
        if (tween) { tween.stop(); }
        window._ta_events.removeListener('update', cloudUpdate);

        self.remove(aura.particleMesh);
      }, 1000 );
    })

    .onComplete(function(){
      window._ta_events.removeListener('update', cloudUpdate);

      self.remove(aura.particleMesh);

      var spell = new Spell({
        name: 'firebullet',
        source: self,
        magicLifeDamage: self.magicLifeDamage,
        manaDamage: self.manaDamage,
      });
      target.hit(spell);
    })

    .onUpdate(function(){
      // get the position data half way along the path
      var pathPosition = line.getPoint(this.distance);

      // move to that position
      aura.particleMesh.position.set(pathPosition.x * 0.9, pathPosition.y * 0.9, pathPosition.z * 0.9);
      aura.particleMesh.updateMatrix();
    })
    .start();
};
