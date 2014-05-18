'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var Character = require('../character');

module.exports = SCV;

/**
 * @exports threearena/elements/SCV
 */
function SCV (options) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 4.0,

    speed: 100,

    name: 'SCV',
    image: '/gamedata/models/monster/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  var loader = new THREE.OBJLoader();
  loader.load( '/gamedata/sandbox/sc2/worker.obj', function ( object ) {

    self.character = object;
    self.character.rotation.y = 1.5;
    self.character.controls = {};
    self.character.update = self.character.setAnimation = function() { };

    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material.map = THREE.ImageUtils.loadTexture( '/gamedata/sandbox/sc2/scv_diffuse.png' );
      }
    });

    object.scale.set(5, 5, 5);
    self.add( object );

    if (options.onLoad) { options.onLoad.apply(self); }
  });
}

inherits(SCV, Character);

