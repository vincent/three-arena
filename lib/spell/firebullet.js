'use strict';

var inherits = require('inherits');

var _ = require('lodash');
var TWEEN = require('tween');
var inherits = require('inherits');

var Spell = require('../spell');
var Utils = require('../utils');
var Particles = require('../particles/cloud');
var Sound = require('../elements/sound');

var stemkoski = require('../particles/stemkoski_ParticleEngine');

module.exports = FireBullet;

/**
 * @exports threearena/spell/firebullet
 */
function FireBullet (options) {

  options = _.merge({}, options, {

    name: 'firebullet',

    isMelee: false,
    magicLifeDamage: 20,

    maxRange: 50.0,

    level: 1,

    needsTarget: true
  });

  Spell.apply(this, [ options ]);

  this.sound = new Sound(['/gamedata/sounds/' + options.name + '.mp3'], 5.0, 50);
  // window._ta_events.on('update', function(game){ self.sound.update(game.camera); });

  // Add a particle system
  this.aura = new stemkoski.ParticleEngine();
  this.aura.setValues(stemkoski.Examples.fireball);
  // this.aura.initialize();

  // this.aura = Particles.Aura('point', 500, THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare0_alpha.png' ), null);
}

inherits(FireBullet, Spell);

FireBullet.prototype.name = 'firebullet';

FireBullet.prototype.start = function (caster, target) {
  var self = this;

  if (! target) {
    console.warn('This spell needs a target');
    return;
  }

  this.sound.play();

  // var endPosition = caster.worldToLocal(target.position.clone());
  // var endPosition = target.position;

  var aura = new stemkoski.ParticleEngine();
  aura.setValues(stemkoski.Examples.fireball);
  aura.initialize();
  aura.particleMesh.position.copy(caster.position);

  var updateCloud = function(game){

    this.update(game.delta);

  }.bind(aura);

  new TWEEN.Tween(aura.particleMesh.position)
    .to(target.position, 200)
    .onStart(function(){
      caster.game.on('update', updateCloud);
      caster.parent.add(aura.particleMesh);
    })
    .onComplete(function(){
      caster.parent.remove(aura.particleMesh);
      caster.game.removeListener('update', updateCloud);
      target.hit(self);
    })
    .start();
};
