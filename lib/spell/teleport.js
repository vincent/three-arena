'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var TWEEN = require('tween');

var settings = require('../settings');

var Spell = require('../spell');
var Sound = require('../elements/sound');

module.exports = Teleport;

/**
 * @exports threearena/spell/Teleport
 */
function Teleport (options) {

  var self = this;

  options = _.merge({}, options, {
    name: 'teleport',

    cooldown: 1 * 1000,

    minRange: 0,
    maxRange: 50,

    needsTargetZone: true
  });

  this.sound = new Sound(['/gamedata/sounds/' + options.name + '.mp3'], 200.0, 1);
  
  window._ta_events.on('update', function(game){
    if (self.source) {
      self.sound.update.call(self.source, game.camera); // called with character as "this"
    }
  });

  Spell.apply(this, [ options ]);
}

inherits(Teleport, Spell);

Teleport.prototype.name = 'Teleport';

///////////////////

/**
 * Return `true` if this spell cast by source can hit target
 * 
 * @param  {Entity} source         The caster entity
 * @param  {Entity} target         The target entity
 * @param  {Number} toleranceRatio acceptable distance ratio
 * @return {Boolean}               `true` if this spell can hit the specified target      
 */
Teleport.prototype.canHit = function (source, target, toleranceRatio) {

  toleranceRatio = toleranceRatio || 1;
  return source !== target && source.position.distanceTo(target.position) < (this.maxRange * toleranceRatio);
};


Teleport.prototype.start = function(source, target) {

  if (! target) {
    console.warn('This spell needs a target zone');
    return;
  }

  this.sound.play();

  source.game.crowd.teleport(source, target.position, function(){

    // keep the camera setting
    var oldCameraType = settings.data.cameraType;
    settings.data.cameraType = settings.CAMERA_MANUAL;

    var cameraPosition = new THREE.Vector3(
      target.position.x,
      target.position.y + settings.data.cameraHeight,
      target.position.z + 200
    );

    // needed to handle transparency
    source.character.meshBody.material.transparent = true;
    source.character.meshBody.material.opacity = 0.01;


    var tweenOpacity = new TWEEN.Tween(source.character.meshBody.material)
      .to({ opacity: 1.0 }, 400)
      .onComplete(function(){
        source.character.meshBody.material.transparent = false;
      });

    var tweenCamera = new TWEEN.Tween(source.game.camera.position)
      .to(cameraPosition, 200)
      .onComplete(function(){
        settings.data.cameraType = oldCameraType;
      });

    tweenOpacity.start();
    tweenCamera.start();
    
  });
};
