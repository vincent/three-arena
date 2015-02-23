'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var Character = require('../character');

module.exports = Dummy;

// geometry cache
var geometries = {};
var material   = new THREE.MeshPhongMaterial({ color: '#FFEEDD' });

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

  var geometry = geometries[ this.state.radius ];

  if (! geometry) {
    geometry = geometries[ this.state.radius ] = new THREE.CylinderGeometry(this.state.radius, this.state.radius, 8);
  }

  this.setCharacter(options.object || new THREE.Mesh(geometry, material));

  if (options.onLoad) { options.onLoad.apply(this); }
}

inherits(Dummy, Character);

Dummy.prototype.setCharacter = function(object) {

  this.character = object;
  this.character.root = this.character;
  this.character.meshBody = this.character;

  this.character.position.y = 2.5;
  this.character.controls = {};

  this.character.update = this.character.update || function() { };
  this.character.setAnimation = this.character.setAnimation || function() { };

  this.add( this.character );
};

