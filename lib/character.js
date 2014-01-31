'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var debug = require('debug')('character');

var Entity = require('./entity');
var Utils = require('./utils');

module.exports = Character;

/** 
 * A module representing a character.
 * 
 * @exports Character
 * 
 * @constructor
 */
function Character (options) {

  Entity.apply( this, [ options ]);

  /*

  Strength is a measure of a Hero's toughness and endurance. Strength determines a Hero's maximum health and health regeneration. Heroes with strength as their primary attribute can be hard to kill, so they will often take initiator and tank roles, initiating fights and taking most of the damage from enemy attacks.
  Every point in strength increases maximum health by 19.
  Every point in strength increases health regeneration by 0.03 HP per second.
  If strength is a Hero's primary attribute, every point in strength increases his or her attack damage by 1.

  Agility is a measure of a Hero's swiftness and dexterity. Agility determines a Hero's armor and attack speed. Heroes with agility as their primary attribute tend to be more dependent on their auto-attacks and items, and are usually capable of falling back on their abilities in a pinch. Agility Heroes often take carry and Gank roles.
  Every 7 points in agility increases a Hero's armor by 1.
  Every point in agility increases a Hero's attack speed by 1.
  If agility is a Hero's primary attribute, every point in agility increases his or her attack damage by 1.

  Intelligence
  Intelligence is a measure of a Hero's wit and wisdom. Intelligence determines a Hero's maximum mana and mana regeneration. Heroes with intelligence as their primary attribute tend to rely on their abilities to deal damage or help others. Intelligence Heroes often take support, gank, and pusher roles.
  Every point in intelligence increases a Hero's maximum Mana by 13.
  Every point in intelligence increases a Hero's mana regeneration by 0.04 mana per second.
  If intelligence is a Hero's primary attribute, every point in intelligence increases his or her attack damage by 1.

  */
}

inherits(Character, Entity);

////////////////

Character.prototype.update = function(game) {

  this.character.update(game.delta);
};

/**
 * Make the character move along a path
 * @param  {Array|THREE.Shape} linepoints the shape or the points the character will walk along
 * @param  {Object} options { start onStart onComplete onUpdate}
 * @return {Tween} the Tween.js object
 */
Character.prototype.moveAlong = function(linepoints, options) {

  var self = this;
  
  options = _.merge({
    append: false,
    speed: this.state.speed,
    onStart: function(){
      self.character.controls.moveForward = true;
      self.character.setAnimation('run');
    },
    onComplete: function(){
      self._forwardRoutes = Math.max(self._forwardRoutes - 1, 0);
      if (self._forwardRoutes <= 0) {
        self.character.controls.moveForward = false;
        self.character.setAnimation('stand');
        delete self._currentTweenDestination;
      }
    },
    onUpdate: function(tween, shape) {

      if (self.isDead()) {
        self.character.setAnimation('stand');
        self._currentTween.stop();
        return;
      }

      if (self.character.activeAnimation !== 'run') {
        self.character.setAnimation('run');
      }

      // get the orientation angle quarter way along the path
      var tangent = shape.getTangent(tween.distance);
      var angle = Math.atan2(-tangent.z, tangent.x);

      // set angle of the character at that position
      // self.rotation.y = angle;
      _.each(self.character.meshes, function(m){ m.rotation.y = angle; });
    }
  }, options);

  // stop current move
  if (self._currentTween && options.append) {

    options.start = self._forwardRoutes < 1;
    self._forwardRoutes += 1;

    var tween = Utils.moveAlong(self, linepoints, options);
    self._currentTween.chain(tween);
    self._currentTween = tween;

  } else {

    if (self._currentTween && self._currentTween.stop) {
      self._currentTween.stop();
    }
    self._forwardRoutes = 1;
    self._currentTween = Utils.moveAlong(self, linepoints, options);
  }

  return self._currentTween;
};

////////////////

Character.prototype.constructor = Character;
