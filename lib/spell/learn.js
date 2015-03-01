'use strict';

var inherits  = require('inherits');

var _         = require('lodash');
var TWEEN     = require('tween');
var inherits  = require('inherits');

var Spell     = require('../spell');
var Utils     = require('../utils');
var Particles = require('../particles/cloud');
var Sound     = require('../elements/sound');
var Spiral    = require('../geometries/spiral');

var stemkoski = require('../particles/stemkoski_ParticleEngine');

module.exports = Learn;

/**
 * @exports threearena/spell/learn
 */
function Learn (options) {

  options = _.merge({}, options, {

    name: 'learn',

    isMelee: false,

    magicLifeDamage: 0,

    maxRange: 1.0,

    level: 1,

    needsTarget: true
  });

  Spell.apply(this, [ options ]);

  this.line = new Spiral(5, 0.1);

  this.aura = new stemkoski.ParticleEngine();
  this.aura.setValues(stemkoski.Examples.flame);

  this.sound = new Sound(['/gamedata/sounds/' + options.name + '.mp3'], 5.0, 50);
  // window._ta_events.on('update', function(game){ self.sound.update(game.camera); });
}

inherits(Learn, Spell);

Learn.prototype.name = 'learn';

Learn.prototype.start = function (caster, target) {

  var self = this;

  if (! target) {
    console.warn('This spell needs a target');
    return;
  }

  this.sound.play();

  this.aura.initialize();
  this.aura.particleMesh.position.copy(caster.position);
  // this.aura.particleMesh.position.y += 1;

  var updateCloud = function(game){

    this.update(game.delta);

  }.bind(this.aura);

  new TWEEN.Tween({ distance: 0 })
    .to({ distance: 1 }, 1000)
    .onStart(function(){
      caster.game.on('update', updateCloud);
      caster.add(self.aura.particleMesh);
    })
    .onUpdate(function(){
      // console.log('particleMesh at', self.line.getPoint(this.distance));
      self.aura.particleMesh.position.copy(self.line.getPoint(this.distance));
    })
    .onComplete(function(){
      caster.remove(self.aura.particleMesh);
      caster.game.removeListener('update', updateCloud);
    })
    .start();

  return true;
};
