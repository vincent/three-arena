'use strict';

var _ = require('lodash');

var log = require('./log');

module.exports = Spell;

/**
 * A castable spell
 * 
 * @exports threearena/spell
 * 
 * @constructor
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
    image: 'default.png'

  }, options);

  _.each(options, function( values, key ){

    self[ key ] = values;

  });
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

  log('Spell ancestor should not be called directly', source, target, toleranceRatio);
  return false;
};

/**
 * Start the spell against the specified target
 * 
 * @param  {Entity} source    The caster entity
 * @param  {Entity=} target   The target entity
 */
Spell.prototype.start = function (source, target) {

  log('Spell ancestor should not be called directly', source, target);
  return false;
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

    } else {

      // FIXME: Does not work because entity.spells[i].ccd is not an observable

      self.ccd = start + self.cooldown - now;
      // console.log(self.name, 'cooldown is now ', self.ccd);
      source.emit('changed', source);

      setTimeout(updateCD, 50);
    }
  };

  setTimeout(updateCD, 50);
};
