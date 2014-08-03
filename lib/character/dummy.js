'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var Character = require('../character');

module.exports = Dummy;

/**
 * @exports threearena/elements/dummy
 */
function Dummy (options) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 3.0,

    maxSpeed: 20,
    maxAcceleration: 10.0,
    separationWeight: 5.0,

    name: 'Dummy',
    image: '/gamedata/models/monster/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  self.character = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 8),
    new THREE.MeshBasicMaterial({
      color: '#FFEEDD'
    })
  );

  self.character.meshBody = self.character;

  self.character.position.y = 2.5;
  self.character.controls = {};
  self.character.update = self.character.setAnimation = function() { };

  self.add( self.character );

  if (options.onLoad) { options.onLoad.apply(self); }
}

inherits(Dummy, Character);

