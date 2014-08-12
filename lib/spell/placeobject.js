'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var TWEEN = require('tween');

var settings = require('../settings');

var Spell = require('../spell');
var Sound = require('../elements/sound');

module.exports = PlaceObject;

/**
 * @exports threearena/spell/PlaceObject
 */
function PlaceObject (options) {

  var self = this;

  options = _.merge({}, options, {
    name: 'PlaceObject',

    cooldown: 1 * 1000,

    minRange: 0,
    maxRange: 20,

    needsTargetZone: true,

    object: new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshBasicMaterial({ color: 'white' })
    )
  });

  this.sound = new Sound(['/gamedata/sounds/' + options.name + '.mp3'], 200.0, 1);
  
  window._ta_events.on('update', function(game){
    if (self.source) {
      self.sound.update.call(self.source, game.camera); // called with character as "this"
    }
  });

  Spell.apply(this, [ options ]);
}

inherits(PlaceObject, Spell);

PlaceObject.prototype.name = 'PlaceObject';

///////////////////

PlaceObject.prototype.prepare = function() {
  Spell.prototype.prepare.apply(this);

  this.handle = (typeof this.object === 'function') ? this.object() : this.object.clone();
  this.handle.geometry.computeBoundingSphere();
};

/**
 * Return `true` if this spell cast by source can hit target
 * 
 * @param  {Entity} source         The caster entity
 * @param  {Entity} target         The target entity
 * @param  {Number} toleranceRatio acceptable distance ratio
 * @return {Boolean}               `true` if this spell can hit the specified target      
 */
PlaceObject.prototype.canHit = function (source, target, toleranceRatio) {

  toleranceRatio = toleranceRatio || 1;
  return source !== target && source.position.distanceTo(target.position) < (this.maxRange * toleranceRatio);
};


PlaceObject.prototype.start = function(source, target) {

  var self = this;

  if (! target) {
    console.warn('This spell needs a target zone');
    return;
  }

  self.sound.play();

  var recast = source.game.pathfinder;

    // add an obstacle
    recast.addTempObstacle(target.position.x, target.position.y, target.position.z, self.handle.geometry.boundingSphere.radius);

    self.handle.material.transparent = false;
    self.handle.material.opacity = 1;
};


PlaceObject.prototype.updateZoneSelector = function(source, arena) {
  var status = arena._currentZoneSelector.position.distanceTo(source.position) < this.maxRange ? 'enabled' : 'disabled';

  if (arena._currentZoneSelector._dirtyStatus !== status) {
    arena._currentZoneSelector.emit(status);
  }

  // update our object at potential position
  this.handle.position.copy(arena._currentZoneSelector.position);

  // if it cannot be placed here, set it more transparent
  this.handle.material.transparent = true;
  this.handle.material.opacity = status === 'enabled' ? 0.8 : 0.3;

  arena.scene.add(this.handle);
};


