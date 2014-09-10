'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var TWEEN = require('tween');

var Spell = require('../spell');
var LightboltMaterial = require('../shaders/lightbolt');

module.exports = Lightbolt;


/**
 * @exports threearena/spell/lightbolt
 */
function Lightbolt (options) {

  options = _.merge({}, options, {

    name: 'lightbolt',

    isMelee: false,
    magicLifeDamage: 20,

    level: 1,

    minRange: 0,
    maxRange: 10,

    needsTarget: false
  });

  Spell.apply(this, [ options ]);

  this.shaderMaterial = new LightboltMaterial();

  // we need an oriented mesh like this:
  //   _____________
  //  |             |
  //  ° 0,0         |
  //  |_____________|
  //
  //   ______________
  //  |      °      |
  //  |      0,0    |
  //  |             |
  //  |             |
  //  |             |
  //  |_____________|
  //

  var geometry = new THREE.PlaneGeometry( 1, 10 );
  // THREE.CylinderGeometry( radiusTop, radiusBottom, height, segmentsRadius, segmentsHeight, openEnded )
  for (var i = 0; i < geometry.vertices.length; i++) {
    geometry.vertices[i].x += 0.5;
    //geometry.vertices[i].y += 5;
  }

  geometry.computeBoundingBox();

  this.plane = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( [ this.shaderMaterial, this.shaderMaterial ] ) );
  //this.plane.rotation.x = 90 * Math.PI / 180;
  // this.plane.position.y *= - .5;
  // this.plane.position.x *= - .5;
  this.plane.position.y += 2;
}

inherits(Lightbolt, Spell);

Lightbolt.prototype.name = 'lightbolt';

///////////////////

Lightbolt.prototype.collideBox = function (box) {
  return this.plane.geometry.boundingBox.isIntersectionBox(box);
};

Lightbolt.prototype.start = function (caster, target) {
  var self = this;
  //self.plane.position.set( caster.position.x, caster.position.y + 5, caster.position.z );

  var update = function(game){
    self.shaderMaterial.uniforms.time.value += game.delta; // * 100 * Math.PI / 180;
  };

  self.tween = new TWEEN.Tween(self.plane.scale)
  .to({ x: 30, y: 3 }, 300) // use
  .easing( TWEEN.Easing.Elastic.InOut )
  .onStart(function(){
    caster.game.on('update', update);
    caster.add(self.plane);
  })
  .onComplete(function(){
    caster.game.removeListener('update', update);
    self.plane.scale.set( 1, 1, 1 );
    caster.remove(self.plane);
  })
  .onUpdate(function(){
    // hit if our plane intersects the target
    if (target && self.collideBox(target.boundingBox)) {
      target.hit(self);
    }
  })
  .start();
};