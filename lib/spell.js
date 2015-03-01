'use strict';

var _ = require('lodash');
var debug = require('debug')('spell');

var inherits = require('inherits');
var EventEmitter = require('EventEmitter');

module.exports = Spell;

/**
 * A castable spell
 *
 * @exports Spell
 *
 * @constructor
 *
 * @param {Object} options
 */
function Spell ( options ) {

  var self = this;

  options = _.merge({

    isMelee: false,
    meleeLifeDamage: 0,
    magicLifeDamage: 0,
    manaDamage: 0,
    source: null,

    cooldown: 0,
    ccd: 0, // current cooldown

    minRange: 1,
    maxRange: 2,

    level: 1,
    image: 'default.png',

    needsTarget: false,
    needsTargetZone: false

  }, options);

  _.each(options, function( values, key ){

    self[ key ] = values;

  });
}

inherits(Spell, EventEmitter);

Spell.prototype.toEvent = function() {
  return {
    name: this.constructor.name,
    meleeLifeDamage: this.meleeLifeDamage,
    magicLifeDamage: this.magicLifeDamage,
    manaDamage: this.manaDamage,
    level: this.level,
  };
};

/**
 * Return `true` if this spell cast by source can hit target
 *
 * @param  {Entity} source         The caster entity
 * @param  {Entity} target         The target entity
 * @param  {Number} toleranceRatio acceptable distance ratio
 * @return {Boolean}               `true` if this spell can hit the specified target
 */
Spell.prototype.canHit = function (source, target, toleranceRatio) {

  toleranceRatio = toleranceRatio || 1;
  return source !== target && source.state.team !== target.state.team && source.position.distanceTo(target.position) < (this.maxRange * toleranceRatio);
};


/**
 * Start the spell against the specified target
 *
 * @param  {Entity} source    The caster entity
 * @param  {Entity=} target   The target entity
 */
Spell.prototype.start = function (source, target) {

  debug('Spell ancestor should not be called directly', source, target);
  debugger; // should never happen so fix it now !

  return false;
};

Spell.prototype.prepare = function() {
};

/**
 * Start the spell cooldown
 *
 * @param  {Entity} source    The caster entity
 * @param  {Entity=} target   The target entity
 */
Spell.prototype.startCooldown = function (source) {

  var self = this,
      start = Date.now();

  self.ccd = self.cooldown;

  var updateCD = function(){
    var now = Date.now();

    // cooldown id finished
    if (now >= start + self.cooldown) {
      self.ccd = 0;
      self.emit('cooldown:end');

    } else {

      // FIXME: Does not work because entity.spells[i].ccd is not an observable

      self.ccd = start + self.cooldown - now;
      debug(self.name, 'cooldown is now ', self.ccd);
      source.emit('changed', source);

      self.emit('cooldown:start');

      setTimeout(updateCD, 50);
    }
  };

  setTimeout(updateCD, 50);
};
