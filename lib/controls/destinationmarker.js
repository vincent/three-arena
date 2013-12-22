'use strict';

var inherits = require('inherits');

var DestinationMarkerMaterial = require('../shaders/lightbolt');

module.exports = DestinationMarker;

/**
 * @exports threearena/spell/destinationmarker
 * 
 * @constructor
 */
function DestinationMarker(options) {

  THREE.Object3D.apply(this);

  this.material = options.material || new DestinationMarkerMaterial();

  this.plane = new THREE.Mesh( new THREE.PlaneGeometry( 6, 6 ), this.material );
  this.plane.rotation.z = 90 * Math.PI / 180;
  // this.plane.position.y *= - .5;
  // this.plane.position.x *= - .5;
  this.plane.position.y = 6;

  this.add(this.plane);
}

inherits(DestinationMarker, THREE.Object3D);

DestinationMarker.prototype.animate = function () {
  var self = this;

  self.plane.visible = true;

  var update = function(game){
    self.material.uniforms.time.value += game.delta; // * 100 * Math.PI / 180;
  };

  window._ta_events.on('update', update);
  setTimeout(function(){
    window._ta_events.removeListener('update', update);
    self.plane.visible = false;
  }, 300);

};

