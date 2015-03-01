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

module.exports = Heal;

/**
 * @exports threearena/spell/heal
 */
function Heal (options) {

  options = _.merge({}, options, {

    name: 'Heal',

    isMelee: false,

    magicLifeDamage: -30,

    maxRange: 50.0,

    level: 1,

    needsTarget: true
  });

  Spell.apply(this, [ options ]);

  this.sound = new Sound(['/gamedata/sounds/' + options.name + '.mp3'], 5.0, 50);
  // window._ta_events.on('update', function(game){ self.sound.update(game.camera); });

  // Add a particle system
  this.aura = new stemkoski.ParticleEngine();
  this.aura.setValues(stemkoski.Examples.leafs);
  // this.aura.initialize();

  // this.aura = Particles.Aura('point', 500, THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare0_alpha.png' ), null);
}

inherits(Heal, Spell);

Heal.prototype.name = 'Heal';

Heal.prototype.canHit = function (source, target, toleranceRatio) {

  toleranceRatio = toleranceRatio || 1;
  return source.state.team === target.state.team && source.position.distanceTo(target.position) < (this.maxRange * toleranceRatio);
};

Heal.prototype.start = function (caster, target) {
  var self = this;

  if (! target) {
    console.warn('This spell needs a target');
    return;
  }

  this.sound.play();

  // var endPosition = caster.worldToLocal(target.position.clone());
  // var endPosition = target.position;

  var aura = new stemkoski.ParticleEngine();
  aura.setValues(stemkoski.Examples.leafs);
  aura.initialize();
  aura.particleMesh.position.copy(caster.position);
  aura.particleMesh.position.y += 10;

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

  return true;
};
