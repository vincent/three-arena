'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Spell = require('../spell');
var Sound = require('../elements/sound');

module.exports = Bite;

/**
 * @exports threearena/spell/bite
 */
function Bite (options) {

  var self = this;

  options = _.merge({}, options, {
    name: 'bite',
    isMelee: true,
    meleeLifeDamage: 10,

    cooldown: 1 * 1000,

    minRange: 0,
    maxRange: 4,
  });

  this.sound = new Sound(['/gamedata/sounds/' + options.name + '.mp3'], 200.0, 1);
  
  window._ta_events.on('update', function(game){
    if (self.source) {
      self.sound.update.call(self.source, game.camera); // called with character as "this"
    }
  });

  Spell.apply(this, [ options ]);
}

inherits(Bite, Spell);

Bite.prototype.name = 'bite';

///////////////////

Bite.prototype.canHit = function(source, target, toleranceRatio) {
  toleranceRatio = toleranceRatio || 1;
  return source !== target && source.position.distanceTo(target.position) - target.state.attackRange < (this.maxRange * toleranceRatio);
};

Bite.prototype.start = function(source, target) {
  this.source = source;
  this.sound.play();
  target.hit(this);
};
