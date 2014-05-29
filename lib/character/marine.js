'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var Character = require('../character');

module.exports = Marine;

/**
 * @exports threearena/elements/dummy
 */
function Marine (options) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 3.0,

    maxSpeed: 10,
    maxAcceleration: 5.0,
    separationWeight: 5.0,

    name: 'Marine',
    image: '/gamedata/models/monster/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  self.blendMesh = new THREE.BlendCharacter();
  
  self.blendMesh.load('/gamedata/sandbox/marine.js', function(){
    self.blendMesh.rotation.y = Math.PI * -135 / 180;
    self.blendMesh.scale.set(0.09, 0.09, 0.09);
    self.add(self.blendMesh);

    if (options.onLoad) { options.onLoad.apply(self); }
  });

  self.character = {};
  self.character.controls = {};

  self.character.update = function(delta) {
    self.blendMesh.update(delta);
    THREE.AnimationHandler.update(delta);
  };
  
  self.character.setAnimation = function(anim) {

    if (self.currentAnimation !== anim) {

      self.currentAnimation = anim;

      anim = {
        stand: [ 'walk', 'idle' ],
        run:   [ 'walk', 'run'  ],
      }[anim];

      self.blendMesh.stopAll();
      self.blendMesh.crossfade(anim[0], anim[1], 1000);
      // self.blendMesh.warp('walk', 'run', 1000);
    }
  };
}

inherits(Marine, Character);

