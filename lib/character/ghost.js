'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Character = require('../character');

module.exports = Ghost;

/**
 * @exports threearena/character/ghost
 * 
 * @constructor
 */
function Ghost ( options ) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    name: 'Ghost',
    image: '/gamedata/models/ghost/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  var loader = new THREE.JSONLoader();

  loader.load( '/gamedata/sandbox/ghost.js', function (geometry, materials) {
    // for preparing animation
    for (var i = 0; i < materials.length; i++) {
      materials[i].morphTargets = true;
      materials[i].skinning = true;
    }
    
    var material = new THREE.MeshFaceMaterial( materials );
    self.character = new THREE.SkinnedMesh( geometry, material );
    // self.character.scale.set(10,10,10);

    self.character.controls = {};

    var t = 0;
    self.character.update = function(delta) {
      if ( t > 1 ) { t = 0; }

      // guess this can be done smarter...
      // (Indeed, there are way more frames than needed and interpolation is not used at all
      //  could be something like - one morph per each skinning pose keyframe, or even less,
      //  animation could be resampled, morphing interpolation handles sparse keyframes quite well.
      //  Simple animation cycles like this look ok with 10-15 frames instead of 100 ;)

      // for ( var i = 0; i < self.character.morphTargetInfluences.length; i++ ) {
      //   self.character.morphTargetInfluences[ i ] = 0;
      // }

      self.character.morphTargetInfluences[0] = t;

      t += delta;

      if (this.material.materials[0].uniforms) {
        this.material.materials[0].uniforms.morphTargetInfluences.value = t;
      }
    };

    self.character.setAnimation = function(animation) {
    };

    THREE.AnimationHandler.add(self.character.geometry.animation);
    var animation = new THREE.Animation(self.character, 'ArmatureAction', THREE.AnimationHandler.CATMULLROM);
    animation.play();


    if (options.onLoad) { options.onLoad.apply(self); }
    self.add( self.character );
  });
}

inherits(Ghost, Character);

Ghost.prototype.update = function(arena) {
  this.character.update(arena.delta);
};
