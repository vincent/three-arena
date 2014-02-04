'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Spell = require('../spell');
var Particles = require('../particles/cloud');

module.exports = FireAura;

/**
 * @exports threearena/spell/fireaura
 */
function FireAura (options) {

  options = _.merge({}, options, {
    name: 'fireaura',
    maxRange: 6.0,
    cooldown: 20 * 1000
  });

  Spell.apply(this, [ options ]);

  this.aura = Particles.Aura('circle', 1000, THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare1_alpha.png' ), null);
}

inherits(FireAura, Spell);

FireAura.prototype.name = 'fireaura';

FireAura.prototype.start = function (caster, target) {
  var self = this;

  var updateCloud = function(game){
    self.aura.update(game.delta);
  }.bind(self);

  caster.character.root.add(this.aura.particleCloud);

  this.aura.start();
  window._ta_events.on('update', updateCloud);

  setTimeout(function(){
    self.aura.stop();
    caster.character.root.remove(self.aura.particleCloud);
    window._ta_events.removeListener('update', updateCloud);
  }, 5000);
};
