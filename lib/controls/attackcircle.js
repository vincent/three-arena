'use strict';

var inherits = require('inherits');

module.exports = AttackCircle;

/**
 * @exports threearena/controls/attackcircle
 * 
 * @constructor
 */
function AttackCircle ( radius ) {

  THREE.Object3D.apply(this);

  var start   = new THREE.Vector3( -radius, 0, 0 ),
    middle  = new THREE.Vector3( 0, 0, -radius ),
    end   = new THREE.Vector3(  radius, 0, 0 );

  this.shape = new THREE.QuadraticBezierCurve3(start, middle, end);

  this.points = this.shape.getSpacedPoints( 10 );
  this.slots = [];
}

inherits(AttackCircle, THREE.Object3D);

AttackCircle.prototype.has = function ( object ) {

  return this.slots.indexOf( object ) > -1;
};

AttackCircle.prototype.place = function ( object ) {

  var point = Math.ceil(this.points.length / 2 + this.slots.length);

  var position = this.localToWorld( this.points[ point ].clone() );

  this.slots.push( object );
  object.position.set( position.x, position.y, position.y );

  return position;
};
